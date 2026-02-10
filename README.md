# CISIA Alert Bot 🎯

A professional web application that monitors CISIA test availability and sends real-time Telegram alerts when CENT@HOME or CENT@CASA spots become available.

## ✨ Features

- **Google OAuth Authentication**: Secure sign-in with Google
- **Real-time Monitoring**: Automated checks every 40 seconds
- **Instant Telegram Alerts**: Get notified immediately when spots open
- **Modern Dark Theme UI**: Professional, fluid interface with animations
- **Responsive Design**: Works perfectly on all devices
- **Free Forever**: No hidden costs or premium plans

## 🚀 Live Demo

Visit the live application: [Your Render URL]

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Authentication**: Passport.js with Google OAuth 2.0
- **Database**: LowDB (JSON-based)
- **Telegram**: node-telegram-bot-api
- **Web Scraping**: Cheerio & Axios
- **Frontend**: EJS templates, Modern CSS with animations
- **Deployment**: Render.com

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 10.2.4
- A Google Cloud Project with OAuth 2.0 credentials
- A Telegram Bot Token

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/navdeepg053-cpu/Cisia_alerts_bot.git
cd Cisia_alerts_bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. Add authorized redirect URIs:
   - For local development: `http://localhost:3000/auth/google/callback`
   - For production: `https://your-app-name.onrender.com/auth/google/callback`
7. Copy your Client ID and Client Secret

### 4. Set Environment Variables

Create a `.env` file in the root directory (for local development):

```env
NODE_ENV=development
SESSION_SECRET=your-random-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### 5. Configure Telegram Bot

The bot token is already configured in the code:
```
Token: 8502714514:AAET39_RZ8u0KY8W1_I-g3y3MXRS7R3nXDY
Bot: @Cent_alertbot
```

### 6. Run Locally

```bash
npm start
```

Visit `http://localhost:3000` in your browser.

## 🌐 Deployment to Render.com

### 1. Push to GitHub

Ensure your code is pushed to your GitHub repository.

### 2. Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `cisia-alerts-bot`
   - **Environment**: `Node`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 3. Set Environment Variables

Add the following environment variables in Render dashboard:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `SESSION_SECRET` | Auto-generate or use your own | Click "Generate" |
| `GOOGLE_CLIENT_ID` | Your Google Client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Your Google Client Secret | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://your-app-name.onrender.com/auth/google/callback` | Replace with your Render URL |

### 4. Deploy

Click "Create Web Service" and wait for the deployment to complete.

### 5. Update Google OAuth Redirect URI

Go back to Google Cloud Console and add your Render.com callback URL to the authorized redirect URIs:
```
https://your-app-name.onrender.com/auth/google/callback
```

## 📱 How to Use

### For Users

1. **Sign in with Google**
   - Visit the website
   - Click "Sign in with Google"
   - Authorize the application

2. **Get Your Telegram Chat ID**
   - Open Telegram
   - Search for `@Cent_alertbot`
   - Send `/start` to the bot
   - Copy your Chat ID

3. **Register Your Chat ID**
   - Go to your dashboard
   - Enter your Telegram Chat ID
   - Click "Save Chat ID"

4. **Receive Alerts**
   - You'll get instant Telegram notifications when CENT@HOME or CENT@CASA spots become available

## 🔍 Monitoring

The application monitors:
- **URL**: https://testcisia.it/calendario.php?tolc=cents&lingua=inglese
- **Interval**: Every 40 seconds
- **Targets**: CENT@HOME and CENT@CASA test spots

## 🏗️ Project Structure

```
Cisia_alerts_bot/
├── app.cjs              # Main application file
├── package.json         # Dependencies
├── render.yaml         # Render deployment config
├── db.json             # User database
├── views/
│   ├── index.ejs       # Landing page
│   └── dashboard.ejs   # User dashboard
└── public/
    └── styles.css      # Modern dark theme CSS
```

## 🔐 Security Features

- Google OAuth 2.0 authentication
- Session-based user management
- Secure cookie handling
- Input validation and sanitization
- HTTPS enforcement in production

## 🐛 Troubleshooting

### Google OAuth Not Working

- Verify your Client ID and Client Secret
- Check that the callback URL is correctly configured in both Google Cloud Console and environment variables
- Ensure cookies are enabled in your browser

### Telegram Alerts Not Received

- Verify your Chat ID is correct
- Make sure you've sent `/start` to @Cent_alertbot
- Check that the bot is running (check server logs)

### Local Development Issues

- Ensure all environment variables are set
- Check that port 3000 is not in use
- Verify Node.js version is >= 18.0.0

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👤 Author

GitHub: [@navdeepg053-cpu](https://github.com/navdeepg053-cpu)

## ⚠️ Disclaimer

This is an independent service and is not affiliated with CISIA.

## 🙏 Acknowledgments

- CISIA for providing the test calendar
- Telegram for the Bot API
- Google for OAuth 2.0
- Render for free hosting
