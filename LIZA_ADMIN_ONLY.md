# Liza Admin-Only Access Implementation

## Overview
Liza (liza@gmail.com) is now the **only admin** and can only access the admin dashboard. All other users are restricted from admin features.

## Changes Made

### Frontend Changes

#### 1. **auth.js** - Login and Google Sign-In Protection
- Updated login redirect to check both role AND username
- Only Liza can be redirected to `admin_dashboard.html`
- All other users go to `dashboard.html`
- Same restriction applied to Google Sign-In flow

**Changes:**
```javascript
// Before: const redirectUrl = data.user.role === 'admin' ? 'admin_dashboard.html' : 'dashboard.html';

// After: const redirectUrl = (data.user.role === 'admin' && data.user.username === 'Liza') ? 'admin_dashboard.html' : 'dashboard.html';
```

#### 2. **admin.js** - Dashboard Access Control
- Added authentication check when admin dashboard loads
- Verifies user is admin AND username is "Liza"
- Non-admin users are redirected to regular dashboard after 2 seconds
- Shows error message: "Access Denied: Only Liza (Admin) can access this dashboard"

**Changes:**
```javascript
// Check if user is admin - Liza only
const user = JSON.parse(localStorage.getItem('user') || '{}');
if (user.role !== 'admin' || user.username !== 'Liza') {
  showAlert('Access Denied: Only Liza (Admin) can access this dashboard', 'error');
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 2000);
}
```

### Backend Changes

#### 1. **middleware/auth.js** - Admin Verification
- Updated `isAdmin` middleware to verify email is `liza@gmail.com`
- Returns 403 error if non-Liza user tries to access admin features
- Error message: "Only Liza can access admin features"

**Changes:**
```javascript
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  // Only Liza can be admin
  if (req.user.email !== 'liza@gmail.com') {
    return res.status(403).json({ error: 'Only Liza can access admin features' });
  }
  next();
};
```

#### 2. **routes/backups.js** - Admin Backup History
- Updated `/api/backups/admin/history` to use `isAdmin` middleware
- Removed manual role check in favor of middleware validation
- Now uses proper email verification through middleware

#### 3. **controllers/authController.js** & **googleAuthController.js** (No Changes Needed)
- These already correctly assign `admin` role only to `liza@gmail.com`
- All other users are assigned `user` role
- Backend role assignment remains secure

## How It Works

### Admin Dashboard Access Flow:
1. User logs in with email/password or Google Sign-In
2. Backend verifies credentials and checks email
3. If email = `liza@gmail.com`: role = `admin`
4. If email != `liza@gmail.com`: role = `user`
5. Frontend receives role in JWT token
6. On login, redirect:
   - Admin (Liza) → `admin_dashboard.html`
   - Non-admin users → `dashboard.html`
7. If non-admin user tries to access `admin_dashboard.html` directly:
   - JavaScript checks role and username on page load
   - Shows error message and redirects to `dashboard.html`

### Backend Admin Endpoints:
1. All admin routes use `verifyToken` and `isAdmin` middleware
2. `isAdmin` middleware checks:
   - User has `admin` role
   - User email is `liza@gmail.com`
3. If either check fails: 403 Forbidden error

## Protected Admin Endpoints
- `GET /api/admin/pending-users`
- `POST /api/admin/approve-user`
- `POST /api/admin/reject-user`
- `GET /api/admin/all-users`
- `POST /api/admin/delete-user`
- `GET /api/admin/backup-logs`
- `GET /api/admin/audit-logs`
- `GET /api/admin/storage-stats`
- `GET /api/backups/admin/history`

## Security Features

### Multi-Layer Protection:
1. **Database Level**: Only Liza has `admin` role assigned
2. **Backend Level**: Email verification in middleware
3. **Frontend Level**: Role check before showing admin dashboard
4. **Token Level**: JWT includes email and role for verification

### User Flow Restrictions:
- Non-admin users cannot:
  - Access admin dashboard page
  - Call admin API endpoints
  - Approve/reject users
  - View all users and audit logs
  - Delete other users

## Testing the Implementation

### Test 1: Admin Login (Liza)
```
1. Login with: liza@gmail.com / 123456
2. Should redirect to admin_dashboard.html
3. Admin dashboard should load without errors
```

### Test 2: Regular User Login
```
1. Create and approve a test user
2. Login with test user credentials
3. Should redirect to dashboard.html (not admin_dashboard)
4. If manually navigate to admin_dashboard.html:
   - Should see "Access Denied" message
   - Should redirect to dashboard.html after 2 seconds
```

### Test 3: API Access Restriction
```
1. Get token for non-admin user
2. Try to call: GET /api/admin/all-users
3. Should receive: 403 Forbidden + "Only Liza can access admin features"
```

## Notes
- Liza's account is automatically created on first server start
- Email: liza@gmail.com
- Default password: 123456
- Cannot be changed through normal UI (admin-only feature)
- If Liza needs to be replaced, modify `liza@gmail.com` email check in:
  - `authController.js` (line 56)
  - `googleAuthController.js` (line 29)
  - `auth.js` middleware (line 31)
