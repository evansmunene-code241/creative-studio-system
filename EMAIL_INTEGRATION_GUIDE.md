# Email Integration Guide

The Creative Studio System now includes **automated email notifications** for key events and workflows.

## Features Implemented

### ✅ Automated Emails

1. **User Registration Confirmation**
   - Sent when user completes registration
   - Notifies about pending admin approval
   - Expected approval timeframe

2. **Account Approval Notification**
   - Sent when admin approves user account
   - Login instructions provided
   - Welcome message

3. **Invoice Created Notification**
   - Sent to invoice creator
   - Includes invoice number and amount
   - Triggered when invoice is created

4. **Invoice Sent to Client**
   - Sent to client when invoice status changes to "sent"
   - Includes invoice details
   - Due date information
   - Direct link to client portal

5. **Payment Confirmation**
   - Sent to client when payment is recorded
   - Confirms payment amount and method
   - Payment date and reference number
   - Professional receipt format

6. **Expense Notification**
   - Sent when expense is recorded
   - Includes project, amount, and category
   - Vendor information if provided

7. **Budget Alert**
   - Sent to project manager when budget reaches 90%
   - Alert escalation at 100% (exceeded)
   - Actionable link to financial dashboard

## Setup Instructions

### Step 1: Configure Email Provider

The system uses **Nodemailer** with SMTP support. Choose your email provider:

#### Option A: Gmail (Recommended for Testing)

1. Go to your Google Account settings
2. Enable "Less secure app access" OR use an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the generated 16-character password

3. Edit `.env` file:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@creativestudio.com
```

#### Option B: SendGrid (Production Recommended)

1. Sign up at https://sendgrid.com
2. Generate an API key
3. Edit `.env` file:
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@creativestudio.com
```

#### Option C: Office 365

```
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your-email@company.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=your-email@company.com
```

#### Option D: Custom SMTP Server

```
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587 (or 465 for SSL)
EMAIL_USER=your-username
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@company.com
```

### Step 2: Update Configuration

1. Navigate to `backend/config/env.js`
2. The configuration is already set to read from environment variables
3. Update your `.env` file with actual credentials

### Step 3: Test Email Service

Restart the backend server:
```bash
cd backend
npm start
```

You should see a message like:
```
✅ Email service ready
```

If configuration fails:
```
⚠️  Email service not configured: [error details]
```

## Email Workflows

### User Onboarding Flow
```
1. User Registers
   ↓
2. Registration Confirmation Email Sent
   ↓
3. Admin Reviews User
   ↓
4. Admin Approves User
   ↓
5. Account Approval Email Sent
   ↓
6. User Can Login
```

### Invoice & Payment Flow
```
1. Invoice Created
   ↓
2. Invoice Created Email → Manager
   ↓
3. Manager Sends to Client
   ↓
4. Invoice Email Sent → Client
   ↓
5. Payment Received
   ↓
6. Payment Confirmation Email → Client
```

### Expense & Budget Flow
```
1. Team Records Expense
   ↓
2. Expense Notification Email → Team
   ↓
3. System Checks Budget
   ↓
4. If Budget >= 90%
   ↓
5. Budget Alert Email → Manager
```

## API Email Endpoints

Email sending is **automatic** with these triggers:

| Event | Email Recipient | Details |
|-------|-----------------|---------|
| User Registration | User Email | Confirmation & approval timeline |
| User Approved | User Email | Account activated, login ready |
| Invoice Created | Manager Email | Invoice #, amount, project |
| Invoice Sent | Client Email | Invoice #, due date, amount |
| Payment Recorded | Client Email | Payment confirmation, receipt |
| Expense Recorded | Team Email | Expense details, category |
| Budget 90%+ | Manager Email | Project name, percentage used |

## Email Content Customization

### Modify Email Templates

Edit `backend/services/emailService.js` to customize email templates:

**Example: Change invoice email header**

```javascript
// Find this line in sendInvoiceToClient():
<h2 style="color: #2c3e50;">Invoice for ${projectName}</h2>

// Change to:
<h2 style="color: #3498db;">📄 New Invoice for ${projectName}</h2>
```

**Example: Add company logo**

```javascript
<div style="text-align: center; margin-bottom: 20px;">
  <img src="https://your-domain.com/logo.png" alt="Company Logo" width="150">
</div>
```

### Email Styling

All emails use inline CSS for maximum email client compatibility. Modify styles in the `style` attributes:

```javascript
<p style="color: #27ae60; font-size: 18px;">
  <strong>$${amount.toFixed(2)}</strong>
</p>
```

## Testing Email Configuration

### Test 1: Check Email Service Status

When you start the server, check the console for:
```
✅ Email service ready
```

### Test 2: Manual Registration Test

1. Go to `http://localhost:3000/register`
2. Register with a test email account
3. Check email inbox for registration confirmation
4. Admin approves user at `/admin`
5. Check email for approval notification

### Test 3: Test Invoice Email

1. Create a project
2. Create an invoice
3. Check console for email logs
4. Click "Send to Client" button
5. Check client email for invoice

### Test 4: Verify Email in Console

During development, check the console for email logs:
```
📧 Email sent to user@example.com: <message-id>
```

If email fails:
```
❌ Email send error: [error details]
```

## Troubleshooting

### Issue: "Email service not configured"

**Solution:** Check your `.env` file:
- Verify EMAIL_HOST is correct
- Verify EMAIL_PORT matches provider (587 for TLS, 465 for SSL)
- Verify EMAIL_USER and EMAIL_PASSWORD are correct
- No extra spaces or quotes

### Issue: "Invalid login" error

**Solutions:**
- Gmail: Use App Password, not regular password
- Gmail: Enable "Less secure app access"
- Other: Check if SMTP authentication is enabled
- Verify credentials are exactly correct (case-sensitive)

### Issue: "Connection timeout"

**Solutions:**
- Check EMAIL_PORT matches EMAIL_HOST
- Verify firewall allows outbound SMTP
- Try different EMAIL_PORT:
  - 587 (TLS, most common)
  - 465 (SSL)
  - 25 (less secure)

### Issue: "SSL certificate error"

**Solution:** For self-signed certificates, add to env:
```
NODE_TLS_REJECT_UNAUTHORIZED=0
```

⚠️ Only for development/testing!

### Issue: Emails not sending but no error

**Check:**
- Is EMAIL_USER and EMAIL_PASSWORD set?
- Is EMAIL_FROM configured?
- Check email provider's SMTP settings
- Some providers block new apps initially (check security settings)

## Security Best Practices

1. **Never commit `.env` file to version control**
   - Add `.env` to `.gitignore`
   - Keep credentials private

2. **Use App Passwords instead of main password**
   - Gmail App Passwords
   - Microsoft App Passwords
   - Never use main account password

3. **Rotate credentials periodically**
   - Change email passwords every 90 days
   - Use strong, unique passwords

4. **Monitor email logs**
   - Check for suspicious sending patterns
   - Review failed email attempts

5. **Enable email provider security**
   - Two-factor authentication on email account
   - Allow specific app access only
   - Monitor login attempts

## Production Deployment

### Before Going Live

1. ✅ Test all email workflows
2. ✅ Verify email provider reliability
3. ✅ Setup email monitoring/alerts
4. ✅ Configure spam filters
5. ✅ Setup bounce handling
6. ✅ Add unsubscribe links (for marketing emails)
7. ✅ Get SPF/DKIM records from email provider

### Email Provider Recommendations

| Provider | Best For | Cost | Setup Time |
|----------|----------|------|-----------|
| **Gmail** | Testing | Free | 5 min |
| **SendGrid** | Production | $10-100/mo | 15 min |
| **AWS SES** | Scale | $0.10 per 1K emails | 20 min |
| **Office 365** | Enterprise | $6-22/user/mo | 10 min |
| **Mailgun** | Developers | $0.50 per K emails | 15 min |

## Advanced Configuration

### Email Queue System (Future Enhancement)

For high-volume applications, implement a queue:

```javascript
// Use Bull or RabbitMQ for email queuing
// Ensures reliable delivery even if API is slow
```

### Bounce Handling (Future Enhancement)

```javascript
// Monitor for hard bounces
// Automatically unsubscribe invalid emails
```

### Email Analytics (Future Enhancement)

```javascript
// Track open rates
// Track click rates
// Monitor delivery success
```

## Support & FAQ

**Q: How often are emails sent?**
A: Only when triggered by specific events (registration, approval, invoice sent, payment, expense, budget alert)

**Q: Can I disable email notifications?**
A: Not yet - future feature. For now, configure email to go to a test account.

**Q: Can I send HTML email?**
A: Yes! All emails use HTML formatting with fallback to plain text.

**Q: Do I need SMTP for SMS?**
A: Yes, currently only email is supported. SMS integration is a Phase 4 enhancement.

**Q: Can I add attachments (like PDF invoices)?**
A: Yes! Edit emailService.js and use Nodemailer's attachment feature:
```javascript
attachments: [
  {
    filename: 'invoice.pdf',
    content: pdfBuffer
  }
]
```

**Q: How do I test emails without sending?**
A: Use Ethereal Email (temp service):
```javascript
const testAccount = await nodemailer.createTestAccount();
// Generates fake SMTP credentials for testing
```

---

## Files Modified/Created

### New Files
- `backend/services/emailService.js` - Email service with all templates

### Modified Files
- `backend/routes/invoices.js` - Added email on invoice creation & sending
- `backend/routes/payments.js` - Added payment confirmation email
- `backend/routes/expenses.js` - Added expense & budget alert emails
- `backend/controllers/authController.js` - Added registration confirmation
- `backend/controllers/adminController.js` - Added approval email
- `backend/config/env.js` - Email configuration (already present)

## Next Steps

1. Configure your email provider credentials in `.env`
2. Restart the backend server
3. Test email workflow by registering a new user
4. Monitor email delivery in console logs
5. Customize email templates as needed (optional)

---

**Version:** 1.0  
**Created:** November 30, 2025  
**Status:** Ready for Production
