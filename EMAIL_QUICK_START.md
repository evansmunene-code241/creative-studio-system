# Email Integration - Quick Start (5 Minutes)

## TL;DR - Get Email Working NOW

### For Testing (Gmail)

1. Go to your Google Account: https://myaccount.google.com/apppasswords
2. Generate App Password for "Mail" on "Windows Computer"
3. Copy the 16-character password

4. Edit `backend/.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-password
EMAIL_FROM=noreply@creativestudio.com
```

5. Restart backend:
```bash
cd backend
npm start
```

6. You should see: ✅ **Email service ready**

### Test It

1. Register new user at http://localhost:3000/register
2. Check email inbox (might be in spam)
3. See registration confirmation email
4. Admin approves at http://localhost:3000/admin
5. Check email for approval notification

**Done!** ✅

---

## What Gets Emailed?

| When | Who Gets Email | What |
|------|---|---|
| User registers | User | Welcome + approval timeline |
| Admin approves | User | Account approved, go login |
| Invoice created | Manager | Invoice #, amount, project |
| Invoice sent | Client | Invoice details, due date |
| Payment recorded | Client | Payment received confirmation |
| Expense added | Team | Expense details |
| Budget 90%+ | Manager | ⚠️ Budget alert |

---

## For Production

Use SendGrid (more reliable):

1. Sign up: https://sendgrid.com
2. Get API Key from dashboard
3. Edit `backend/.env`:
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@yourcompany.com
```
4. Restart and done!

---

## Files Changed

✅ Created: `backend/services/emailService.js` (email templates & logic)
✅ Updated: `invoices.js` (send invoice emails)
✅ Updated: `payments.js` (payment confirmation)
✅ Updated: `expenses.js` (expense + budget alerts)
✅ Updated: `authController.js` (registration + approval)
✅ Updated: `adminController.js` (user approval email)

---

## Troubleshooting

### Error: "Email service not configured"
Check `.env` file - make sure EMAIL_USER and EMAIL_PASSWORD are set

### Gmail: "Invalid login"
Use App Password (16 chars), not your regular Google password

### Emails not arriving
Check spam folder, or wait 2-3 minutes (sometimes slow)

### Can't find `.env` file
It exists! Look in `backend/` folder. If not, create it with above credentials.

---

Full guide: `EMAIL_INTEGRATION_GUIDE.md`
