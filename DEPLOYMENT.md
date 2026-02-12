# CISIA Alert Bot - Setup Guide for Render.com

## Required Environment Variables

When deploying to Render.com, you must configure the following environment variables in your Render dashboard:

### 1. Google OAuth Credentials

**How to get Google OAuth credentials:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Google+ API** for your project
4. Navigate to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - User Type: External
   - Add necessary scopes: email, profile
6. Create OAuth 2.0 Client ID:
   - Application Type: Web application
   - Authorized redirect URIs:
     - Add: `https://YOUR-APP-NAME.onrender.com/auth/google/callback`
     - Replace `YOUR-APP-NAME` with your actual Render app name

7. Copy the Client ID and Client Secret

### Environment Variables to Set in Render:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `NODE_ENV` | `production` | Sets Node environment to production |
| `SESSION_SECRET` | (auto-generate) | Secret key for session management - click "Generate" in Render |
| `GOOGLE_CLIENT_ID` | Your Google Client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Your Google Client Secret | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://YOUR-APP-NAME.onrender.com/auth/google/callback` | OAuth callback URL |
| `TELEGRAM_BOT_TOKEN` | Your Telegram Bot Token | **Required** - From BotFather |

**Important:** The `TELEGRAM_BOT_TOKEN` environment variable is **required**. The application will fail to start with a clear error message if this variable is not set.

## Deployment Steps

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Deploy CISIA Alert Bot"
git push origin main
```

### 2. Create Render Web Service

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure service:
   - **Name**: `cisia-alerts-bot` (or your preferred name)
   - **Environment**: Node
   - **Branch**: main
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 3. Add Environment Variables

In the Render service settings:
1. Go to **Environment** tab
2. Add all environment variables listed above (including the **required** `TELEGRAM_BOT_TOKEN`)
3. Click **Save Changes**

**Critical:** Make sure to set the `TELEGRAM_BOT_TOKEN` environment variable. Without it, the application will immediately exit with an error message.

### 4. Update Google OAuth Redirect URI

After your Render app is deployed:
1. Note your Render app URL (e.g., `https://cisia-alerts-bot.onrender.com`)
2. Go back to Google Cloud Console
3. Update OAuth 2.0 Client ID:
   - Add authorized redirect URI: `https://your-app-name.onrender.com/auth/google/callback`
4. Save changes

### 5. Deploy

Click **Deploy** in Render dashboard. The deployment will:
- Install dependencies
- Start the application
- Begin monitoring CISIA calendar every 40 seconds

## Telegram Bot Configuration

**Important:** You must create your own Telegram bot and set the token as an environment variable.

### Creating a Telegram Bot:

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the instructions to create your bot:
   - Choose a name for your bot
   - Choose a username for your bot (must end in 'bot')
4. BotFather will provide you with a bot token (e.g., `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Copy this token and set it as the `TELEGRAM_BOT_TOKEN` environment variable in Render

The bot automatically responds to `/start` command with the user's Chat ID.

## Testing the Deployment

1. Visit your Render URL
2. Click "Sign in with Google"
3. Authorize the application
4. Follow the dashboard instructions to get your Telegram Chat ID
5. Save your Chat ID
6. Wait for CISIA test spot notifications!

## Monitoring

### Application Logs
View logs in Render dashboard under the **Logs** tab.

### Check Status
- Visit `/users` endpoint to see registered users count
- Check application is running from the Render dashboard

## Troubleshooting

### Google OAuth Not Working
- Verify Client ID and Secret are correct
- Check callback URL matches exactly (including https://)
- Ensure Google+ API is enabled
- Check OAuth consent screen is properly configured

### App Not Starting
- Check Render logs for errors
- Verify all environment variables are set
- Ensure build command completed successfully

### Telegram Bot Not Responding
- Bot token is hardcoded, should work immediately
- Test by sending `/start` to @Cent_alertbot on Telegram
- Check if user is entering correct Chat ID format (numbers only)

### Free Tier Limitations
- Render free tier may spin down after inactivity
- First request after spin-down may take 30-60 seconds
- Service automatically restarts on incoming requests

## Production Checklist

- [ ] All environment variables configured
- [ ] Google OAuth redirect URI updated
- [ ] Telegram bot tested with `/start` command
- [ ] Application accessible via Render URL
- [ ] Google sign-in working
- [ ] Dashboard loads correctly
- [ ] Chat ID save functionality works
- [ ] Scraping logs show CISIA checks every 40s
- [ ] Test alert by manually triggering (if possible)

## Support

For issues or questions:
- Check the [GitHub repository](https://github.com/navdeepg053-cpu/Cisia_alerts_bot)
- Review Render logs for errors
- Verify Google Cloud Console configuration
