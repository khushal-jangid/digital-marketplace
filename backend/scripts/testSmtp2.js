import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
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
      subject: 'Test Verification Email #2',
      html: '<p>Direct SMTP port 465 test</p>'
    });
    console.log('Result:', info.response);
  } catch (err) {
    console.error('Error:', err);
  }
})();
