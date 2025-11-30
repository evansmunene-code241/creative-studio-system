const nodemailer = require('nodemailer');
const config = require('../config/env');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: config.EMAIL_PORT === 465,
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASSWORD
      }
    });

    // Verify connection (optional)
    this.transporter.verify((error, success) => {
      if (error) {
        console.log('⚠️  Email service not configured:', error.message);
      } else {
        console.log('✅ Email service ready');
      }
    });
  }

  async sendEmail(to, subject, htmlContent, textContent = '') {
    try {
      const mailOptions = {
        from: config.EMAIL_FROM,
        to,
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '')
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email send error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Invoice Created Email
  async sendInvoiceCreated(userEmail, userName, invoiceNumber, projectName, amount) {
    const subject = `New Invoice #${invoiceNumber} Created`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2c3e50;">Invoice Created</h2>
        <p>Hello ${userName},</p>
        
        <p>A new invoice has been created for your project:</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Invoice Number:</strong> #${invoiceNumber}</p>
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
        </div>
        
        <p>You can view and manage this invoice in your Financial Dashboard.</p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 20px;">
          This is an automated message from Creative Studio System.
        </p>
      </div>
    `;

    return this.sendEmail(userEmail, subject, htmlContent);
  }

  // Invoice Sent Email (for clients)
  async sendInvoiceToClient(clientEmail, clientName, invoiceNumber, projectName, amount, dueDate) {
    const subject = `Invoice #${invoiceNumber} - Payment Due ${dueDate}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2c3e50;">Invoice for ${projectName}</h2>
        <p>Hello ${clientName},</p>
        
        <p>Please find your invoice details below:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td><strong>Invoice Number:</strong></td>
              <td>#${invoiceNumber}</td>
            </tr>
            <tr>
              <td><strong>Project:</strong></td>
              <td>${projectName}</td>
            </tr>
            <tr>
              <td><strong>Amount Due:</strong></td>
              <td style="font-size: 16px; color: #27ae60;"><strong>$${amount.toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td><strong>Due Date:</strong></td>
              <td>${dueDate}</td>
            </tr>
          </table>
        </div>
        
        <p>Please log into your portal to view the complete invoice and make payment.</p>
        <p style="text-align: center;">
          <a href="http://localhost:3000/client" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Invoice in Portal</a>
        </p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 20px;">
          If you have any questions, please contact us.
        </p>
      </div>
    `;

    return this.sendEmail(clientEmail, subject, htmlContent);
  }

  // Payment Received Email
  async sendPaymentConfirmation(userEmail, userName, invoiceNumber, amount, paymentDate, paymentMethod) {
    const subject = `Payment Received for Invoice #${invoiceNumber}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #27ae60;">✓ Payment Received</h2>
        <p>Hello ${userName},</p>
        
        <p>We have received your payment. Thank you!</p>
        
        <div style="background: #f0f8f5; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
          <p><strong>Invoice Number:</strong> #${invoiceNumber}</p>
          <p><strong>Amount Received:</strong> <span style="color: #27ae60; font-size: 18px;"><strong>$${amount.toFixed(2)}</strong></span></p>
          <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          <p><strong>Date:</strong> ${paymentDate}</p>
        </div>
        
        <p>A receipt has been generated and is available in your account.</p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 20px;">
          This is an automated message from Creative Studio System.
        </p>
      </div>
    `;

    return this.sendEmail(userEmail, subject, htmlContent);
  }

  // Expense Recorded Email
  async sendExpenseNotification(managerEmail, managerName, projectName, amount, category, description) {
    const subject = `New Expense Recorded - $${amount.toFixed(2)}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2c3e50;">Expense Recorded</h2>
        <p>Hello ${managerName},</p>
        
        <p>A new expense has been recorded for your project:</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Description:</strong> ${description}</p>
        </div>
        
        <p>Check your Financial Dashboard for budget impact and detailed analysis.</p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 20px;">
          This is an automated message from Creative Studio System.
        </p>
      </div>
    `;

    return this.sendEmail(managerEmail, subject, htmlContent);
  }

  // Budget Alert Email
  async sendBudgetAlert(managerEmail, managerName, projectName, percentageUsed) {
    const alertLevel = percentageUsed >= 100 ? 'EXCEEDED' : 'ALERT';
    const subject = `⚠️  Budget ${alertLevel}: ${projectName} (${percentageUsed}%)`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #e74c3c;">⚠️  Budget Alert</h2>
        <p>Hello ${managerName},</p>
        
        <p>Your project budget has reached a critical level:</p>
        
        <div style="background: #fff5f5; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #e74c3c;">
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Budget Used:</strong> <span style="color: #e74c3c; font-size: 18px;"><strong>${percentageUsed}%</strong></span></p>
        </div>
        
        <p>Please review your expenses and take action if necessary.</p>
        
        <p style="text-align: center;">
          <a href="http://localhost:3000/financial" style="background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Budget Details</a>
        </p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 20px;">
          This is an automated message from Creative Studio System.
        </p>
      </div>
    `;

    return this.sendEmail(managerEmail, subject, htmlContent);
  }

  // Deliverable Approval Request Email
  async sendApprovalRequest(clientEmail, clientName, projectName, deliverableName) {
    const subject = `Deliverable Awaiting Your Approval - ${projectName}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2c3e50;">Approval Needed</h2>
        <p>Hello ${clientName},</p>
        
        <p>A deliverable is ready for your review and approval:</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Deliverable:</strong> ${deliverableName}</p>
        </div>
        
        <p>Please review and either approve or provide feedback.</p>
        
        <p style="text-align: center;">
          <a href="http://localhost:3000/client" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Deliverable</a>
        </p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 20px;">
          This is an automated message from Creative Studio System.
        </p>
      </div>
    `;

    return this.sendEmail(clientEmail, subject, htmlContent);
  }

  // User Registration Confirmation
  async sendRegistrationConfirmation(userEmail, userName) {
    const subject = 'Welcome to Creative Studio - Account Created';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2c3e50;">Welcome to Creative Studio!</h2>
        <p>Hello ${userName},</p>
        
        <p>Thank you for registering. Your account has been created and is pending admin approval.</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p>You will receive another email once your account has been approved by our admin team.</p>
          <p>Expected approval time: 24 hours</p>
        </div>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 20px;">
          This is an automated message from Creative Studio System.
        </p>
      </div>
    `;

    return this.sendEmail(userEmail, subject, htmlContent);
  }

  // User Account Approved Email
  async sendAccountApproved(userEmail, userName) {
    const subject = 'Account Approved - Welcome to Creative Studio!';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #27ae60;">✓ Account Approved</h2>
        <p>Hello ${userName},</p>
        
        <p>Great news! Your account has been approved by our admin team.</p>
        
        <div style="background: #f0f8f5; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #27ae60;">
          <p>You can now login to your dashboard and start using the Creative Studio System.</p>
        </div>
        
        <p style="text-align: center;">
          <a href="http://localhost:3000" style="background: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Dashboard</a>
        </p>
        
        <p style="color: #7f8c8d; font-size: 12px; margin-top: 20px;">
          This is an automated message from Creative Studio System.
        </p>
      </div>
    `;

    return this.sendEmail(userEmail, subject, htmlContent);
  }

  // Batch email (for notifications)
  async sendBatchEmail(recipients, subject, htmlContent) {
    const results = [];
    for (const email of recipients) {
      const result = await this.sendEmail(email, subject, htmlContent);
      results.push({ email, ...result });
    }
    return results;
  }
}

module.exports = new EmailService();
