import express from 'express';
import bodyParser from 'body-parser';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import axios from 'axios';
import * as cheerio from 'cheerio';
import TelegramBot from 'node-telegram-bot-api';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Persistent storage for Render
const dbPath = process.env.NODE_ENV === 'production' ? '/data/db.json' : './db.json';

// Global db reference
let db;
let bot;

// IIFE for async DB/bot init (Render/Node compatible)
(async () => {
  // DB setup
  const adapter = new JSONFile(dbPath);
  db = new Low(adapter);
  db.data ??= { users: [], lastStatus: false };
  await db.read();
  await db.write();
  
  // Bot setup
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('Error: TELEGRAM_BOT_TOKEN env var missing.');
    process.exit(1);
  }
  bot = new TelegramBot(token);
  console.log('Bot and DB initialized.');
})();

const PORT = process.env.PORT || 3000;

// Routes
app.get('/', (req, res) => {
  res.render('index', { message: '' });
});

app.get('/users', (req, res) => {
  if (!db?.data) return res.status(500).json({ error: 'DB not ready' });
  res.json({ count: db.data.users.length, users: db.data.users });
});

app.post('/signup', async (req, res) => {
  const chatId = req.body.chatId?.trim();
  if (!chatId || !/^d+$/.test(chatId)) {
    return res.render('index', { message: 'Invalid Chat ID: Must be a number.' });
  }
  
  if (!db?.data) {
    return res.render('index', { message: 'Service initializing, try again shortly.' });
  }
  
  if (db.data.users.find(u => u.chatId === chatId)) {
    return res.render('index', { message: 'Already signed up.' });
  }
  
  db.data.users.push({ chatId });
  await db.write();
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
            (seatsText.includes('available') || seatsText.includes('disponibili') || /d+s*(seats?|posti)/.test(seatsText))) {
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
          await db.write();
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
      const message = '🚨 CISIA Alert: CENT@HOME/CENT@CASA spots available!
📅 Check: https://testcisia.it/calendario.php?tolc=cents&lingua=inglese';
      
      for (const user of db.data.users) {
        await sendWithRetry(user.chatId, message);
      }
      
      db.data.lastStatus = true;
      await db.write();
    } else if (!currentStatus && lastStatus) {
      console.log('No spots, resetting status.');
      db.data.lastStatus = false;
      await db.write();
    }
  } catch (error) {
    console.error('Alert error:', error.message);
  }
}

// Poll every 30s
setInterval(checkAndAlert, 30000);

// Startup check after delay
setTimeout(checkAndAlert, 5000);

app.listen(PORT, () => {
  console.log(`🚀 Server on port ${PORT} | Scraping CISIA every 30s`);
  console.log(`👥 Check /users endpoint for signed up count`);
});
