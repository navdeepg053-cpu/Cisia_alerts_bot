import express from 'express';
import bodyParser from 'body-parser';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import axios from 'axios';
import * as cheerio from 'cheerio';
import TelegramBot from 'node-telegram-bot-api';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Use /data for persistent storage on Render
const dbPath = process.env.NODE_ENV === 'production' ? '/data/db.json' : './db.json';

if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const adapter = new JSONFile(dbPath);
const db = new Low(adapter);
await db.read(); // Read existing data first
db.data ||= { users: [], lastStatus: false }; // Default if file is empty/new
await db.write(); // Ensure file exists

const PORT = process.env.PORT || 3000;

// Telegram bot setup
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Error: TELEGRAM_BOT_TOKEN environment variable is not set.');
  process.exit(1);
}
const bot = new TelegramBot(token);

// Routes
app.get('/', (req, res) => {
  res.render('index', { message: '' });
});

app.post('/signup', (req, res) => {
  const chatId = req.body.chatId.trim();
  if (!chatId) {
    return res.render('index', { message: 'Chat ID is required.' });
  }
  // Validate chatId is numeric (Telegram chat IDs are integers)
  if (!/^\d+$/.test(chatId)) {
    return res.render('index', { message: 'Invalid Chat ID: Must be a number (e.g., 123456789).' });
  }
  const existing = db.data.users.find(user => user.chatId === chatId);
  if (existing) {
    return res.render('index', { message: 'You are already signed up.' });
  }
  db.data.users.push({ chatId });
  db.write();
  res.render('index', { message: 'Signed up successfully! You will be alerted when spots open.' });
});

// Scraper function
async function checkSpots() {
  try {
    const url = 'https://testcisia.it/calendario.php?tolc=cents&lingua=inglese';
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);
    const bodyText = $('body').text().toLowerCase();

    // Quick check for no dates
    if (bodyText.includes('no dates available') || bodyText.includes('nessuna data disponibile')) {
      return false;
    }

    // Scan rows for specific format and available status
    let hasOpen = false;
    $('tr').each((i, row) => {
      const rowText = $(row).text().toLowerCase().trim();
      if (rowText.length < 20) return; // Skip short/header rows
      if ((rowText.includes('cent@home') || rowText.includes('cent@casa')) &&
          (rowText.includes('available seats') || rowText.includes('posti disponibili'))) {
        hasOpen = true;
        return false; // Exit loop early
      }
    });
    return hasOpen;
  } catch (error) {
    console.error('Error in scraper:', error.message);
    return false;
  }
}

// Alert logic (only alert on status change from false to true)
async function checkAndAlert() {
  try {
    const currentStatus = await checkSpots();
    const lastStatus = db.data.lastStatus;

    if (currentStatus && !lastStatus) {
      console.log('Spots opened! Sending alerts...');
      const message = 'Alert: Spots for CENT@HOME/CENT@CASA have opened up! Check now: https://testcisia.it/calendario.php?tolc=cents&lingua=inglese';
      db.data.users.forEach((user) => {
        bot.sendMessage(user.chatId, message).catch((err) => {
          console.error(`Failed to send to ${user.chatId}:`, err.message);
        });
      });
      db.data.lastStatus = true;
      await db.write();
    } else if (!currentStatus && lastStatus) {
      db.data.lastStatus = false;
      await db.write();
    }
  } catch (error) {
    console.error('Error in checkAndAlert:', error.message);
  }
}

// Run checker every 30 seconds
setInterval(checkAndAlert, 30000);

// Initial check on startup
checkAndAlert();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
