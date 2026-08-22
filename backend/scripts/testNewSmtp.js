import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'khushaljangra721@gmail.com',
    pass: 'vhlbtlrliulwlqdi'
  }
});

(async () => {
  try {
    const info = await transporter.sendMail({
      from: '"ApexMarket Support" <khushaljangra721@gmail.com>',
      to: 'khushaljangra721@gmail.com',
      subject: '🎉 ApexMarket Email System Successfully Connected & Verified!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #4f46e5; margin-top: 0;">🚀 Email Delivery System 100% Operational!</h2>
          <p>Hello Khushal,</p>
          <p>Your Gmail SMTP credentials have been successfully authenticated with Google Mail Servers.</p>
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0; color: #166534; font-weight: bold;">✓ Live Status: Active</p>
            <p style="margin: 4px 0 0 0; color: #15803d; font-size: 13px;">Customer Order Confirmations, Support Tickets, and Invoices will now be delivered reliably.</p>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            ApexMarket Notification System • Digital Marketplace
          </p>
        </div>
      `
    });
    console.log('SUCCESS: Email sent successfully! MessageId:', info.messageId);
    process.exit(0);
  } catch (err) {
    console.error('SMTP Error:', err.message);
    process.exit(1);
  }
})();
