# Google Sign-In Setup Guide

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing one)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add Authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost` (if needed)
7. Add Authorized redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:3000/dashboard.html`
   - `http://localhost:3000/admin_dashboard.html`
8. Copy your **Client ID**

## Step 2: Add Client ID to Frontend

1. Open `frontend/js/auth.js`
2. Find this line:
   ```javascript
   client_id: 'YOUR_GOOGLE_CLIENT_ID',
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID from Step 1

Example:
```javascript
client_id: '123456789-abcdefg.apps.googleusercontent.com',
```

## Step 3: Test

1. Start your server: `npm start`
2. Go to `http://localhost:3000`
3. Click the Google Sign-In button
4. You should see Google's sign-in dialog
5. After signing in, you'll be registered/logged in automatically

## How It Works

- **New users**: Get registered with status "pending" (need admin approval)
- **Existing users**: Get logged in directly if already approved
- **Auto-redirect**: Admins go to admin dashboard, users to user dashboard
- **Profile picture**: Automatically stored from Google account

## Troubleshooting

### Button not showing?
- Check browser console for errors
- Verify Client ID is correct
- Make sure Google Sign-In script loaded

### "Invalid client" error?
- Double-check Client ID spelling
- Verify localhost:3000 is in Authorized JavaScript origins

### Can't login after registration?
- Admin needs to approve the account first
- Check admin dashboard for pending users

## Optional: Enable Email Verification

The system automatically creates accounts and sends emails to admin. No additional configuration needed.

## Production Deployment

When deploying to production:
1. Update Google OAuth credentials with your domain
2. Replace `YOUR_GOOGLE_CLIENT_ID` with production Client ID
3. Add your production URLs to authorized origins
4. Update CORS settings in `backend/server.js` if needed
