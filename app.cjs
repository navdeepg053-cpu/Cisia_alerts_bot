const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { LowSync } = require('lowdb');
const { JSONFileSync } = require('lowdb/node');
const axios = require('axios');
const cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Session configuration - validate required env var
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  console.error('Error: SESSION_SECRET environment variable must be set in production');
  process.exit(1);
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key-only-for-local-development',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Database path - uses current directory (writable on Render free tier)
const dbPath = './db.json';

// Global db reference
let db;
let bot;

console.log("Bot init starting...");

// Telegram bot token - using token provided in requirements
// Can be overridden with TELEGRAM_BOT_TOKEN environment variable if needed
const token = process.env.TELEGRAM_BOT_TOKEN || '8502714514:AAET39_RZ8u0KY8W1_I-g3y3MXRS7R3nXDY';
console.log("Token loaded, creating bot...");
bot = new TelegramBot(token, { polling: true });

console.log("Bot created - polling should be active");

// Handle /start command to send Chat ID
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `✅ Your Chat ID is: ${chatId}\n\nCopy this ID and use it to register on the CISIA Alert website.`);
});

// Passport Google OAuth Strategy - validate required env vars
if (process.env.NODE_ENV === 'production') {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
    console.error('Error: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL must be set in production');
    process.exit(1);
  }
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'not-configured',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'not-configured',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
  },
  (accessToken, refreshToken, profile, done) => {
    // Store user profile in session
    return done(null, {
      id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      photo: profile.photos[0]?.value
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Initialize database
const adapter = new JSONFileSync(dbPath);
db = new LowSync(adapter, { users: [], lastStatus: false });
db.read();
db.data ||= { users: [], lastStatus: false };
db.write();
console.log("✅ Database initialized");

const PORT = process.env.PORT || 3000;

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

// Routes
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/dashboard');
  } else {
    res.render('index');
  }
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

app.get('/dashboard', isAuthenticated, (req, res) => {
  if (!db) return res.status(500).send('Database not ready');
  
  // Find if user already has chat ID registered
  const userEntry = db.data.users.find(u => u.email === req.user.email);
  
  res.render('dashboard', { 
    user: req.user,
    chatId: userEntry?.chatId || null,
    message: ''
  });
});

app.post('/update-chatid', isAuthenticated, async (req, res) => {
  const chatId = req.body.chatId?.trim();
  
  if (!chatId || !/^\d+$/.test(chatId)) {
    return res.render('dashboard', { 
      user: req.user,
      chatId: null,
      message: 'Invalid Chat ID: Must be a number.' 
    });
  }
  
  if (!db?.data) {
    return res.render('dashboard', { 
      user: req.user,
      chatId: null,
      message: 'Service initializing, try again shortly.' 
    });
  }
  
  // Remove old entry if exists and add new one
  db.data.users = db.data.users.filter(u => u.email !== req.user.email);
  db.data.users.push({ 
    email: req.user.email, 
    chatId,
    name: req.user.name,
    registeredAt: new Date().toISOString()
  });
  db.write();
  
  res.render('dashboard', { 
    user: req.user,
    chatId,
    message: '✅ Chat ID saved! You will receive alerts when spots open.' 
  });
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/');
  });
});

app.get('/users', (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB not ready' });
  res.json({ count: db.data.users.length, users: db.data.users });
});

app.post('/signup', async (req, res) => {
  const chatId = req.body.chatId?.trim();
  if (!chatId || !/^\d+$/.test(chatId)) {
    return res.render('index', { message: 'Invalid Chat ID: Must be a number.' });
  }
  
  if (!db?.data) {
    return res.render('index', { message: 'Service initializing, try again shortly.' });
  }
  
  if (db.data.users.find(u => u.chatId === chatId)) {
    return res.render('index', { message: 'Already signed up.' });
  }
  
  db.data.users.push({ chatId });
  db.write();
  res.render('index', { message: 'Signed up! Alerts when spots open.' });
});

// Robust scraper with headers and precise selectors + logging
async function checkSpots() {
  try {
    const url = 'https://testcisia.it/calendario.php?tolc=cents&lingua=inglese';
    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const rows = $('table tr').slice(1); // Skip headers
    console.log(`🕵️ CISIA scrape: Found ${rows.length} table rows`);
    
    for (const row of rows) {
      const cells = $(row).find('td');
      if (cells.length >= 3) {
        const testType = cells.eq(0).text().toLowerCase().trim();
        const seatsText = cells.eq(-1).text().toLowerCase().trim();
        
        if ((testType.includes('cent@home') || testType.includes('cent@casa')) &&
            (seatsText.includes('available') || seatsText.includes('disponibili') || /\d+\s*(seats?|posti)/.test(seatsText))) {
          console.log(`✅ SPOT FOUND: ${testType} - ${seatsText}`);
          return true;
        }
      }
    }
    console.log('❌ No CENT@HOME/CASA spots available');
    return false;
  } catch (error) {
    console.error('Scraper error:', error.message);
    return false;
  }
}

// Retry Telegram sender
async function sendWithRetry(chatId, message, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await bot.sendMessage(chatId, message);
      return true;
    } catch (err) {
      console.error(`Retry ${i+1}/${retries} for ${chatId}:`, err.message);
      if (i === retries - 1) {
        // Clean bad user
        if (db?.data) {
          db.data.users = db.data.users.filter(u => u.chatId !== chatId);
          db.write();
        }
      }
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return false;
}

// Main checker
async function checkAndAlert() {
  if (!db || !bot) return; // Wait for init
  
  try {
    const currentStatus = await checkSpots();
    const lastStatus = db.data.lastStatus;
    
    if (currentStatus && !lastStatus) {
      console.log('🔔 SPOTS DETECTED! Alerting all users...');
      const message = `CISIA Alert: CENT@HOME/CENT@CASA spots available!
Check: https://testcisia.it/calendario.php?tolc=cents&lingua=inglese`;
      
      for (const user of db.data.users) {
        await sendWithRetry(user.chatId, message);
      }
      
      db.data.lastStatus = true;
      db.write();
    } else if (!currentStatus && lastStatus) {
      console.log('No spots, resetting status.');
      db.data.lastStatus = false;
      db.write();
    }
  } catch (error) {
    console.error('Alert error:', error.message);
  }
}

// Poll every 40s
setInterval(checkAndAlert, 40000);

// Startup check after delay
setTimeout(checkAndAlert, 5000);

app.listen(PORT, () => {
  console.log(`Server on port ${PORT} | Scraping CISIA every 40s`);
  console.log(`Check /users endpoint for signed up count`);
});
