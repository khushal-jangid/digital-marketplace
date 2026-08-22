import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'khushaljangra721@gmail.com',
    pass: 'vyeabuxmiwfvmblu'
  }
});

(async () => {
  try {
    const info = await transporter.sendMail({
      from: '"ApexMarket Support" <khushaljangra721@gmail.com>',
      to: 'khushaljangra721@gmail.com',
      subject: '✅ ApexMarket Email System Diagnostics Test',
      html: '<h2>ApexMarket Email System is 100% Active!</h2><p>Your Gmail SMTP is functioning properly for Order Confirmations and Support Desk.</p>'
    });
    console.log('SUCCESS: Test Email Sent! MessageId:', info.messageId);
    process.exit(0);
  } catch (err) {
    console.error('SMTP Error:', err.message);
    process.exit(1);
  }
})();
