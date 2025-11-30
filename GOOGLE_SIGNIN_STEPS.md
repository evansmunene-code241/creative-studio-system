# Google Sign-In Setup - Exact Step-by-Step Guide

## Part 1: Get Your Google Client ID

### Step 1: Open Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Sign in with your Google account (create one if needed)

### Step 2: Create a New Project
1. At the top, click the **Project dropdown**
2. Click **NEW PROJECT**
3. Enter project name: `Creative Studio`
4. Click **CREATE**
5. Wait 30 seconds for project to be created

### Step 3: Go to Credentials
1. Go directly to: https://console.cloud.google.com/apis/credentials
2. (Skip the API Library - it will be enabled automatically)

### Step 4: Configure Consent Screen (if prompted)
1. If you see **"CONFIGURE CONSENT SCREEN"** button, click it
2. If not, continue to Step 5
3. If you click it:
   - Choose **External**
   - Click **CREATE**
   - Fill in these fields:
     - App name: `Creative Studio`
     - User support email: (use your email)
     - Developer contact: (use your email)
   - Click **SAVE AND CONTINUE**
   - Skip the Scopes section, click **SAVE AND CONTINUE**
   - Review and click **BACK TO DASHBOARD**

### Step 5: Create OAuth Credentials
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click the blue **CREATE CREDENTIALS** button at the top
3. From dropdown menu, select **OAuth client ID**
4. If prompted to configure consent screen again:
   - Choose **External**
   - Click **CREATE**
   - Fill in:
     - App name: `Creative Studio`
     - User support email: (your email)
     - Developer contact: (your email)
   - Click **SAVE AND CONTINUE**
   - Skip scopes, click **SAVE AND CONTINUE**
   - Click **BACK TO DASHBOARD**

### Step 6: Fill in OAuth Details
1. A form appears
2. Name: `Creative Studio Web`
3. Under **Authorized JavaScript origins**, click **ADD URI**
   - Paste: `http://localhost:3000`
4. Click **ADD URI** again
   - Paste: `http://localhost`
5. Under **Authorized redirect URIs**, click **ADD URI** three times and add:
   - `http://localhost:3000/`
   - `http://localhost:3000/dashboard.html`
   - `http://localhost:3000/admin_dashboard.html`
6. Click **CREATE** button

### Step 7: Copy Your Client ID
1. A popup window appears showing your credentials
2. Find the **Client ID** field
3. It looks like: `123456789-abcde.apps.googleusercontent.com`
4. **Click to COPY** this entire value
5. **SAVE IT** somewhere (you'll need it next)

---

## Part 2: Add Client ID to Your App

### Step 8: Edit auth.js File
1. Open: `c:\Users\DX\Downloads\creative studio system\frontend\js\auth.js`
2. Find this line (around line 112):
   ```javascript
   client_id: 'YOUR_GOOGLE_CLIENT_ID',
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID` with your Client ID from Step 6

**Example (before):**
```javascript
client_id: 'YOUR_GOOGLE_CLIENT_ID',
```

**Example (after):**
```javascript
client_id: '123456789-abcdefghijklmnop.apps.googleusercontent.com',
```

4. **SAVE** the file (Ctrl+S)

---

## Part 3: Test It

### Step 9: Restart Your Server
1. Stop the server (Ctrl+C in terminal)
2. Run again:
   ```
   npm start
   ```

### Step 10: Test Google Sign-In
1. Open browser: `http://localhost:3000`
2. You should see a **Google Sign-In button** below the login form
3. Click the Google button
4. A Google login popup appears
5. Sign in with your Google account
6. You'll be registered/logged in automatically

---

## If Something Goes Wrong

### Error: "Credential is null"
- **Fix**: Make sure you added `http://localhost:3000` to Authorized JavaScript origins in Google Cloud Console

### Error: "Invalid client"
- **Fix**: Double-check Client ID is copied exactly (no extra spaces)

### Button not showing
- **Fix**: 
  1. Open browser DevTools (F12)
  2. Check Console tab for errors
  3. Verify Client ID is correct in auth.js

### Google button appears but click does nothing
- **Fix**: 
  1. Check that Google Identity Services API is ENABLED
  2. Refresh page
  3. Clear browser cache (Ctrl+Shift+Delete)

---

## What Happens After Sign-In

**For New Users:**
- Account created automatically
- Status = "pending" (waiting for admin approval)
- Shown message: "Please wait for admin approval"

**For Existing Users (Already Approved):**
- Logged in directly
- Profile picture saved
- Redirected to dashboard

**For Admin (Liza):**
- Logged in with admin access
- Redirected to admin dashboard

---

## Complete Example

**Your auth.js should look like this:**

```javascript
function initGoogleSignIn() {
  if (window.google && window.google.accounts) {
    window.google.accounts.id.initialize({
      client_id: '123456789-abcdefghijklmnop.apps.googleusercontent.com', // YOUR ACTUAL CLIENT ID
      callback: handleGoogleResponse
    });

    const googleButton = document.getElementById('googleSignInButton');
    if (googleButton) {
      window.google.accounts.id.renderButton(
        googleButton,
        {
          type: 'standard',
          size: 'large',
          text: 'signup_with',
          theme: 'outline',
          locale: 'en'
        }
      );
    }
  }
}
```

---

## Summary

✅ **Done!** You now have:
- Google Sign-In button on login page
- Google Sign-In button on register page
- Automatic account creation from Google profile
- Admin approval system for new Google users
- Integration with existing password-based auth

Enjoy! 🎉
