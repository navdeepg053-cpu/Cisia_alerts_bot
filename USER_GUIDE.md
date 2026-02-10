# Features & User Guide

## 🎯 Overview

CISIA Alert Bot is a modern web application that monitors CISIA test availability and sends real-time Telegram notifications when CENT@HOME or CENT@CASA spots become available.

## ✨ Key Features

### 1. **Secure Google Authentication**
- Sign in with your Google account
- No password management required
- OAuth 2.0 security standards
- Session-based authentication

### 2. **Real-Time Monitoring**
- Automated checks every 40 seconds
- Monitors official CISIA calendar
- Detects CENT@HOME and CENT@CASA availability
- Smart status tracking to avoid duplicate alerts

### 3. **Instant Telegram Alerts**
- Get notified immediately when spots open
- Direct message to your Telegram account
- No spam - only real availability updates
- Link to book your spot included

### 4. **Modern Dark Theme UI**
- Professional, sleek design
- Animated particle background
- Smooth transitions and effects
- Fully responsive on all devices

### 5. **User-Friendly Dashboard**
- Easy Chat ID management
- Visual status indicators
- Quick links to CISIA calendar
- Profile information display

## 📱 How to Use

### Step 1: Sign In
1. Visit the website
2. Click "Sign in with Google"
3. Authorize the application with your Google account
4. You'll be redirected to your dashboard

### Step 2: Get Your Telegram Chat ID
1. Open Telegram on your phone or desktop
2. Search for `@Cent_alertbot`
3. Start a chat with the bot
4. Send the message: `/start`
5. The bot will reply with your unique Chat ID (example: `123456789`)
6. Copy this number

### Step 3: Register Your Chat ID
1. Return to your dashboard on the website
2. Paste your Chat ID in the input field
3. Click "Save Chat ID"
4. You'll see a confirmation message

### Step 4: Receive Alerts
- That's it! You're all set
- When CISIA test spots open, you'll receive a Telegram message
- The message includes a direct link to the CISIA calendar
- Be quick - spots fill up fast!

## 🔔 What Triggers an Alert?

You'll receive a notification when:
- CENT@HOME spots become available
- CENT@CASA spots become available
- The calendar shows "available" or "disponibili" status
- Seat counts are shown for these test types

You won't receive notifications when:
- No spots are available
- The system already notified you about current availability
- Only other test types are available

## 📊 Monitoring Details

### What We Check
- **URL**: https://testcisia.it/calendario.php?tolc=cents&lingua=inglese
- **Frequency**: Every 40 seconds
- **Method**: Web scraping with intelligent parsing
- **Uptime**: 24/7 (subject to Render.com free tier limitations)

### How It Works
1. System fetches the CISIA calendar page
2. Parses the HTML to find test availability
3. Checks for CENT@HOME and CENT@CASA spots
4. Compares with previous status
5. If spots opened since last check, sends alerts to all registered users
6. Updates status to prevent duplicate alerts

## 💡 Tips for Success

### Getting Alerts Faster
- Keep Telegram notifications enabled on your phone
- Consider enabling Telegram desktop notifications
- Have the CISIA booking page ready in another tab
- Know your credentials for quick booking

### Troubleshooting
- **Not receiving alerts?**
  - Double-check your Chat ID is correct (numbers only)
  - Send `/start` to @Cent_alertbot again to verify
  - Ensure you haven't blocked the bot on Telegram
  - Check that you're signed in to your dashboard

- **Chat ID not saving?**
  - Make sure you're entering only numbers
  - No spaces or special characters
  - Chat ID should be 9-10 digits long
  - Try refreshing the page and signing in again

- **Dashboard not loading?**
  - Clear your browser cache
  - Try incognito/private browsing
  - Check your internet connection
  - Sign out and sign in again

## 🔒 Privacy & Security

### What We Store
- Your Google email address
- Your name (from Google profile)
- Your profile photo URL (from Google)
- Your Telegram Chat ID
- Registration timestamp

### What We Don't Store
- Your Google password (we never see it)
- Your Telegram messages
- Your browsing history
- Any other personal data

### Data Usage
- Your data is only used to send you CISIA alerts
- We never share your information with third parties
- You can remove your data anytime by signing in and updating your Chat ID to empty

### Security Measures
- HTTPS encryption in production
- Secure session management
- OAuth 2.0 authentication
- Environment variable protection for sensitive data
- Regular dependency updates

## 📈 System Status Indicators

### In Your Dashboard
- **Live** (Green dot) - System is actively monitoring
- **40 seconds** - Check interval
- **Free** - Service cost

### Understanding Availability
- System runs 24/7 on Render.com free tier
- May sleep after periods of inactivity
- Automatically wakes up on any web request
- Monitoring resumes immediately upon wake

## 🆘 Support

### Need Help?
1. Check this guide first
2. Review the README.md for technical details
3. Check DEPLOYMENT.md for setup issues
4. Review the GitHub repository issues

### Common Questions

**Q: How much does this cost?**
A: Completely free! No hidden fees, no premium tiers.

**Q: Can I use multiple Telegram accounts?**
A: Currently, one Google account = one Chat ID. Sign in with different Google accounts for multiple Telegram accounts.

**Q: Will this work for other CISIA tests?**
A: Currently optimized for CENT@HOME and CENT@CASA only.

**Q: How accurate is the monitoring?**
A: Very accurate! We check the official CISIA calendar every 40 seconds using reliable web scraping.

**Q: What if I miss the alert?**
A: The alert is sent the moment spots appear. Check Telegram frequently, and consider enabling sound notifications.

## 🌟 Best Practices

1. **Set up early** - Register before you need it
2. **Test it** - Send `/start` to the bot to verify
3. **Stay ready** - Have your CISIA credentials handy
4. **Be quick** - Spots can fill within minutes
5. **Keep signed in** - Your session lasts 30 days

## 🎓 About CISIA Tests

This tool monitors:
- **CENT@HOME** - Remote testing option
- **CENT@CASA** - Home-based testing option

Always verify availability on the official CISIA website before booking.

## ⚖️ Disclaimer

This is an independent service and is not affiliated with, endorsed by, or connected to CISIA in any way. Use at your own discretion. Always verify information on the official CISIA website.

## 🙏 Acknowledgments

Built with modern web technologies to help students secure their test spots more efficiently.

---

**Ready to never miss a spot?** [Sign in now →](/)
