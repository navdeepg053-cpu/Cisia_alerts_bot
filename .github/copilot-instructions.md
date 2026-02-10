# Copilot Instructions for CISIA Alerts Bot

## Project Overview

This is a **CISIA Telegram Alert Bot** that monitors test availability at CISIA (an Italian test center) and sends real-time Telegram notifications when spots become available. The bot watches for "CENT@HOME" and "CENT@CASA" test openings and alerts registered users via Telegram messaging.

## Technology Stack

- **Runtime**: Node.js (JavaScript/CommonJS)
- **Web Framework**: Express.js
- **Telegram Integration**: `node-telegram-bot-api`
- **Web Scraping**: Cheerio and Axios
- **Database**: LowDB (lightweight JSON-based database)
- **Templating**: EJS
- **Deployment**: Render.com (Node.js environment)

## Project Structure

```
Cisia_alerts_bot/
├── app.cjs              # Main Express app (polling, alerts, routes)
├── package.json         # Dependencies & scripts
├── render.yaml          # Render deployment config
├── db.json             # User data storage (LowDB)
├── views/
│   └── index.ejs       # Sign-up form page
└── public/
    └── styles.css      # Frontend styling
```

## Key Architecture Components

1. **HTTP Routes**:
   - `/` - User sign-up form page
   - `/users` - Returns count of registered users
   - `/signup` - POST endpoint for user registration

2. **Background Job**: 
   - Scrapes CISIA website every 30 seconds
   - Checks for test availability changes
   - Sends Telegram notifications to all registered users

3. **Storage**:
   - LowDB stores user chat IDs and last status state
   - Data persists in `db.json`

4. **Telegram Bot**:
   - Polling-based bot
   - Sends messages to subscribed users when spots open

## Coding Conventions

### File Naming
- Use `.cjs` extension for CommonJS files
- Use kebab-case for file names

### Code Style
- Use CommonJS (`require`/`module.exports`) - do NOT use ES6 imports
- Use `const` and `let` - avoid `var`
- Use async/await for asynchronous operations
- Use arrow functions for callbacks and concise functions
- Add descriptive comments for complex logic

### Error Handling
- Always include try-catch blocks for async operations
- Log errors with context using `console.error()`
- Provide meaningful error messages in API responses
- Handle Telegram API errors gracefully to prevent bot crashes

### Express Route Conventions
- Use descriptive route names
- Return appropriate HTTP status codes (200, 400, 500)
- Send JSON responses with consistent structure
- Validate user input before processing

### Telegram Bot Best Practices
- Always check if message and chat exist before accessing
- Handle bot initialization errors
- Implement retry logic for failed message sends
- Avoid blocking the main thread with heavy operations

## Environment Variables

Required environment variables:
- `TELEGRAM_BOT_TOKEN`: Token from BotFather for Telegram bot authentication

## Dependencies Management

- Run `npm install` to install dependencies
- Keep dependencies up to date but test thoroughly before updating major versions
- Critical dependencies:
  - `express`: Web server framework
  - `node-telegram-bot-api`: Telegram bot integration
  - `cheerio`: HTML parsing for scraping
  - `axios`: HTTP client
  - `lowdb`: JSON database
  - `ejs`: Templating engine

## Testing Guidelines

- Test Telegram bot functionality manually with test accounts
- Test scraping logic with actual CISIA website
- Verify database persistence across restarts
- Test error handling scenarios (network failures, API errors)
- Validate user registration flow end-to-end

## Deployment

- **Platform**: Render.com
- **Configuration**: `render.yaml` defines the service
- **Port**: Application runs on port 3000
- **Auto-scaling**: Free tier may spin down when idle
- **Environment**: Set `TELEGRAM_BOT_TOKEN` in Render dashboard

## Important Notes

1. **Web Scraping**: The bot scrapes the CISIA website. Be mindful of rate limiting and website structure changes.

2. **Polling Interval**: Currently set to 30 seconds. Adjust based on rate limits and responsiveness needs.

3. **Database**: LowDB is file-based. For production at scale, consider migration to a proper database.

4. **Render Free Tier**: Service may sleep after inactivity. First request after sleep takes longer.

5. **Bot Commands**: The bot doesn't currently implement commands beyond the signup flow.

## Security Considerations

- Never commit `TELEGRAM_BOT_TOKEN` to version control
- Validate and sanitize all user inputs
- Be careful with rate limiting to avoid being blocked by CISIA
- Implement user verification to prevent spam signups
- Consider implementing a maximum user limit

## Future Enhancements

When adding new features, consider:
- Adding bot commands (`/start`, `/stop`, `/status`)
- Implementing user preferences (frequency, test types)
- Adding unsubscribe functionality
- Implementing better error recovery and retry logic
- Adding logging for monitoring and debugging
- Implementing rate limiting on API endpoints
- Adding user authentication/verification
