import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Email-Token'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html, auth } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Get SMTP credentials from Vercel environment or fallback to request body
  const smtpUser = process.env.EMAIL_USER || auth?.user;
  const smtpPassRaw = process.env.EMAIL_PASS || auth?.pass;
  const smtpPass = smtpPassRaw ? smtpPassRaw.replace(/\s+/g, '') : '';

  if (!smtpUser || !smtpPass) {
    return res.status(400).json({ error: 'SMTP credentials missing' });
  }

  // Simple security check using a token
  const token = req.headers['x-email-token'];
  const expectedToken = process.env.EMAIL_SECURITY_TOKEN || 'kj_secure_mail_token_2026';
  if (token !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Digital Marketplace" <${smtpUser}>`,
      to,
      subject,
      html,
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Vercel SMTP error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
