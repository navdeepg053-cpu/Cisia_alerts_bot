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
    
    const availableSpots = [];
    
    for (const row of rows) {
      const cells = $(row).find('td');
      if (cells.length === 8) {
        // Parse 8-column table structure:
        // 0: MODALITÀ (test type), 1: UNIVERSITÀ, 2: REGIONE STATO ESTERO, 
        // 3: CITTÀ, 4: FINE ISCRIZIONI, 5: POSTI (seats), 6: STATO, 7: DATA TEST
        const testType = cells.eq(0).text().trim();
        const university = cells.eq(1).text().trim();
        const region = cells.eq(2).text().trim();
        const city = cells.eq(3).text().trim();
        const bookingsDeadline = cells.eq(4).text().trim();
        const seatsText = cells.eq(5).text().trim();
        const status = cells.eq(6).text().trim();
        const testDate = cells.eq(7).text().trim();
        
        // Detailed logging for debugging
        console.log(`🔍 Row data - testType: "${testType}" | seatsText: "${seatsText}" | city: "${city}"`);
        
        // Check if it's CENT@CASA and has available seats (positive integer)
        if (testType.toLowerCase().includes('cent@casa') &&
            (seatsText.toLowerCase().includes('available') || seatsText.toLowerCase().includes('disponibili') || /\b[1-9]\d*\b/.test(seatsText))) {
          console.log(`✅ SPOT FOUND: ${testType} at ${university} - ${seatsText} seats`);
          availableSpots.push({
            testType,
            university,
            region,
            city,
            bookingsDeadline,
            seats: seatsText,
            status,
            testDate
          });
        }
      } else if (cells.length > 0) {
        console.log(`⚠️ Warning: Found row with ${cells.length} columns (expected 8)`);
      }
    }
    
    if (availableSpots.length > 0) {
      console.log(`✅ Total spots found: ${availableSpots.length}`);
      return { available: true, spots: availableSpots };
    }
    
    console.log('❌ No CENT@CASA spots available');
    return { available: false, spots: [] };
  } catch (error) {
    console.error('Scraper error:', error.message);
    return { available: false, spots: [] };
  }
}

// Retry Telegram sender with enhanced error handling and logging
async function sendWithRetry(chatId, message, retries = 3) {
  console.log(`📤 Attempting to send alert to chatId ${chatId}...`);
  
  for (let i = 0; i < retries; i++) {
    try {
      await bot.sendMessage(chatId, message);
      console.log(`✅ Alert sent successfully to chatId ${chatId}`);
      return true;
    } catch (err) {
      console.error(`❌ Failed to send alert to chatId ${chatId} (Attempt ${i+1}/${retries}):`, err.message);
      
      if (i === retries - 1) {
        // After all retries failed, log critical error and clean bad user
        console.error(`🚨 CRITICAL: Failed to send alert to chatId ${chatId} after ${retries} attempts. Removing user from database.`);
        if (db?.data) {
          db.data.users = db.data.users.filter(u => u.chatId !== chatId);
          db.write();
          console.log(`🗑️ Removed invalid chatId ${chatId} from database`);
        }
        return false;
      }
      
      // Wait before retry with increasing delay
      const waitTime = 1000 * (i + 1);
      console.log(`⏳ Retrying in ${waitTime}ms...`);
      await new Promise(r => setTimeout(r, waitTime));
    }
  }
  return false;
}

// Main checker
async function checkAndAlert() {
  if (!db || !bot) return; // Wait for init
  
  try {
    const result = await checkSpots();
    const currentStatus = result.available;
    const lastStatus = db.data.lastStatus;
    
    if (currentStatus && !lastStatus) {
      console.log('🔔 SPOTS DETECTED! Alerting all users...');
      
      // Build detailed message with all available spots
      let message = `🎯 CISIA Alert: CENT@CASA spots available!\n\n`;
      
      for (const spot of result.spots) {
        message += `📍 ${spot.testType}\n`;
        message += `🏛️ University: ${spot.university}\n`;
        message += `📌 City: ${spot.city}, ${spot.region}\n`;
        message += `💺 Seats: ${spot.seats}\n`;
        message += `📅 Test Date: ${spot.testDate}\n`;
        message += `⏰ Deadline: ${spot.bookingsDeadline}\n`;
        message += `✅ Status: ${spot.status}\n`;
        message += `\n`;
      }
      
      message += `🔗 Book now: https://testcisia.it/calendario.php?tolc=cents&lingua=inglese`;
      
      const totalUsers = db.data.users.length;
      console.log(`📨 Sending alerts to ${totalUsers} users...`);
      let successCount = 0;
      let failureCount = 0;
      
      for (const user of db.data.users) {
        const success = await sendWithRetry(user.chatId, message);
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
      }
      
      console.log(`📊 Alert summary: ${successCount} successful, ${failureCount} failed out of ${totalUsers} users`);
      
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
