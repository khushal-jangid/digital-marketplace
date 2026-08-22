import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars immediately for ES Module import order safety in monorepos
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

let transporter = null;

const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || 'khushaljangra721@gmail.com';
const smtpPassRaw = process.env.SMTP_PASS || process.env.EMAIL_PASS || 'vhlb tlrl iulw lqdi';
const smtpPass = smtpPassRaw ? smtpPassRaw.replace(/\s+/g, '') : 'vhlbtlrliulwlqdi';
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT) || 465;
const smtpFrom = process.env.SMTP_FROM || `"ApexMarket Support" <${smtpUser}>`;

if (smtpHost && smtpUser && smtpPass) {
  const isGmail = smtpHost.includes('gmail.com');
  const transportConfig = isGmail 
    ? {
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      }
    : {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      };

  transporter = nodemailer.createTransport(transportConfig);
  console.log(`SMTP Mail Server Configured (${isGmail ? 'Gmail Service' : `${smtpHost}:${smtpPort}`})`);
} else {
  console.log('SMTP credentials missing. Mail will be logged to system console.');
}

const sendMailViaVercelBridge = async (toEmail, subject, htmlContent) => {
  const vercelUrl = process.env.VERCEL_MAILER_URL || 'https://codewithkj.vercel.app';

  try {
    const response = await fetch(`${vercelUrl}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: toEmail,
        subject,
        html: htmlContent,
      }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      console.log(`Email successfully sent via Vercel bridge to ${toEmail}`);
      return true;
    } else {
      console.error('Failed to send email via Vercel bridge:', data.error || 'Unknown error');
      return false;
    }
  } catch (err) {
    console.error('Error calling Vercel mailer bridge:', err.message);
    return false;
  }
};

/**
 * Send purchase confirmation email
 * @param {string} toEmail - Recipient email
 * @param {string} userName - Name of user
 * @param {Object} order - Order details
 * @param {Array} downloadLinks - Array of { title, downloadUrl } objects
 */
export const sendPurchaseEmail = async (toEmail, userName, order, downloadLinks) => {
  const itemsListHtml = order.items
    .map((item) => `<li><strong>${item.titleAtPurchase}</strong> - INR ${item.priceAtPurchase}</li>`)
    .join('');

  const linksHtml = downloadLinks
    .map(
      (link) =>
        `<div style="margin: 15px 0; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 16px;">📦 ${link.title}</h4>
          <a href="${link.downloadUrl}" target="_blank" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 14px; font-weight: bold;">
            ⬇️ Download Project Source Code
          </a>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b; word-break: break-all;">
            Direct Link: <a href="${link.downloadUrl}" target="_blank" style="color: #2563eb;">${link.downloadUrl}</a>
          </p>
        </div>`
    )
    .join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #334155; line-height: 1.6; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #10b981; margin-top: 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">🎉 Payment Approved & Order Confirmed!</h2>
      <p>Hello ${userName || 'Developer'},</p>
      <p>Thank you for shopping at ApexMarket! Your payment has been verified and your source code is ready for download.</p>
      
      <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0;">
        <p style="margin: 0 0 6px 0;"><strong>Invoice ID:</strong> ${order.invoiceNumber || order.razorpayOrderId || order._id}</p>
        <p style="margin: 0;"><strong>Total Paid:</strong> INR ₹${order.totalAmount}</p>
      </div>

      <h3 style="color: #1e293b; margin-top: 20px;">Download Your Projects:</h3>
      ${linksHtml}

      <div style="margin: 24px 0; text-align: center;">
        <a href="https://codewithkj.vercel.app/dashboard" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Open Dashboard (My Purchases)
        </a>
      </div>

      <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #94a3b8;">
        ApexMarket Support • khushaljangra721@gmail.com
      </p>
    </div>
  `;

  const subject = `🎉 Download Unlocked: Order #${order.invoiceNumber || order.razorpayOrderId || order._id}`;

  if (smtpUser && smtpPass) {
    const sent = await sendMailViaVercelBridge(toEmail, subject, htmlContent);
    if (sent) return;
  }

  if (transporter) {
    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`Purchase confirmation email successfully sent to ${toEmail}`);
    } catch (error) {
      console.error('Error sending purchase email:', error.message);
    }
  } else {
    // Log to console for local testing
    console.log('\n--- EMAIL SENT (MOCK) ---');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: Your Purchase Confirmation - Order ${order.razorpayOrderId}`);
    console.log(`Total Paid: INR ${order.totalAmount}`);
    console.log('Download Links generated:');
    downloadLinks.forEach((link) => {
      console.log(` - ${link.title}: ${link.downloadUrl}`);
    });
    console.log('-------------------------\n');
  }
};

/**
 * Broadcast new project notification to subscribers
 * @param {Array} subscribersList - Subscriber array
 * @param {Object} project - The project details
 */
export const sendNewProjectEmail = async (subscribersList, project) => {
  if (!subscribersList || subscribersList.length === 0) return;

  const emails = subscribersList.map((s) => s.email);

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #334155; line-height: 1.6;">
      <h2 style="color: #6366f1; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">🚀 New Source Code Available!</h2>
      <p>Hello Developer,</p>
      <p>We are excited to announce that a new production-ready project is now live on our marketplace!</p>
      
      <div style="margin: 20px 0; padding: 20px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #1e293b;">${project.title}</h3>
        <p style="color: #64748b; font-size: 14px;">${project.description ? project.description.slice(0, 180) : ''}...</p>
        <p><strong>Category:</strong> <span style="text-transform: capitalize;">${project.category}</span></p>
        <p><strong>Price:</strong> INR ${project.price}</p>
        
        <a href="https://codewithkj.vercel.app/projects/${project._id}" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-top: 10px;">View Project Details</a>
      </div>

      <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8;">
        You received this email because you subscribed to our newsletter. If you wish to unsubscribe, contact support at tempphone300@gmail.com.
      </p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: smtpFrom,
        bcc: emails,
        subject: `🚀 New Launch: ${project.title} is now available!`,
        html: htmlContent,
      });
      console.log(`New project broadcast email successfully sent to ${emails.length} subscribers.`);
    } catch (error) {
      console.error('Error broadcasting new project email:', error.message);
    }
  } else {
    console.log('\n--- NEW PROJECT BROADCAST EMAIL (MOCK) ---');
    console.log(`BCC: ${emails.join(', ')}`);
    console.log(`Subject: New Launch: ${project.title}`);
    console.log(`Link: https://codewithkj.vercel.app/projects/${project._id}`);
    console.log('-------------------------------------------\n');
  }
};

/**
 * Broadcast new coupon notification to subscribers
 * @param {Array} subscribersList - Subscriber array
 * @param {Object} coupon - The coupon details
 */
export const sendNewCouponEmail = async (subscribersList, coupon) => {
  if (!subscribersList || subscribersList.length === 0) return;

  const emails = subscribersList.map((s) => s.email);

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #334155; line-height: 1.6;">
      <h2 style="color: #10b981; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">🎉 Exclusive Discount Coupon Created!</h2>
      <p>Hello Developer,</p>
      <p>Here is an exclusive coupon code for your next purchase on our marketplace!</p>
      
      <div style="margin: 20px 0; padding: 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 10px 0; color: #166534; font-size: 14px; font-weight: 600;">USE COUPON CODE AT CHECKOUT</p>
        <span style="font-size: 32px; font-weight: 800; color: #047857; letter-spacing: 2px; background: #d1fae5; padding: 8px 24px; border-radius: 8px; border: 2px dashed #059669; display: inline-block;">${coupon.code}</span>
        
        <p style="margin: 15px 0 0 0; color: #065f46; font-size: 15px;">
          Get <strong>${coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `INR ${coupon.discountValue} OFF`}</strong>!
        </p>
        <p style="margin: 5px 0 0 0; color: #047857; font-size: 12px;">
          Valid until: ${new Date(coupon.expiryDate).toLocaleDateString()}
        </p>
      </div>

      <p style="text-align: center; margin-top: 20px;">
        <a href="https://codewithkj.vercel.app/projects" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Browse Projects Directory</a>
      </p>

      <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8;">
        You received this email because you subscribed to our newsletter. If you wish to unsubscribe, contact support at tempphone300@gmail.com.
      </p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: smtpFrom,
        bcc: emails,
        subject: `🎉 Exclusive offer: Get discount using code ${coupon.code}!`,
        html: htmlContent,
      });
      console.log(`New coupon broadcast email successfully sent to ${emails.length} subscribers.`);
    } catch (error) {
      console.error('Error broadcasting new coupon email:', error.message);
    }
  } else {
    console.log('\n--- NEW COUPON BROADCAST EMAIL (MOCK) ---');
    console.log(`BCC: ${emails.join(', ')}`);
    console.log(`Subject: Discount coupon code ${coupon.code}!`);
    console.log(`Discount: ${coupon.discountValue}`);
    console.log('-----------------------------------------\n');
  }
};

/**
 * Send One-Time Password (OTP) email for login
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP code
 */
export const sendOtpEmail = async (toEmail, otp) => {
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; color: #334155; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
      <h2 style="color: #2563eb; margin-top: 0;">Login Verification Code</h2>
      <p>Hello,</p>
      <p>Use the following One-Time Password (OTP) to log in to your account. This code is valid for 10 minutes and should not be shared with anyone.</p>
      
      <div style="margin: 24px 0; text-align: center;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b; background: #f1f5f9; padding: 12px 24px; border-radius: 6px; border: 1px dashed #cbd5e1;">${otp}</span>
      </div>
      
      <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">If you did not request this login code, you can safely ignore this email.</p>
    </div>
  `;

  const subject = `Your Login OTP: ${otp}`;

  if (smtpUser && smtpPass) {
    const sent = await sendMailViaVercelBridge(toEmail, subject, htmlContent);
    if (sent) return true;
  }

  if (!transporter) {
    console.log(`\n--- OTP LOGIN EMAIL (MOCK SIMULATOR) ---`);
    console.log(`To: ${toEmail}`);
    console.log(`Subject: Your Login OTP: ${otp}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`-----------------------------------------\n`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: toEmail,
      subject: `Your Login OTP: ${otp}`,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error.message);
    return false;
  }
};

/**
 * Send purchase rejection email
 * @param {string} toEmail - Recipient email
 * @param {string} userName - Name of user
 * @param {Object} order - Order details
 */
export const sendRejectionEmail = async (toEmail, userName, order) => {
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #334155; line-height: 1.6;">
      <h2 style="color: #dc2626; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Payment Verification Failed</h2>
      <p>Hello ${userName},</p>
      <p>We were unable to verify the transaction details (UTR/Reference Number) submitted for your order.</p>
      
      <div style="margin: 20px 0; padding: 15px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px;">
        <p style="margin: 0;"><strong>Order ID:</strong> ${order.razorpayOrderId || order._id}</p>
        <p style="margin: 5px 0 0 0;"><strong>Status:</strong> Rejected / Unverified</p>
      </div>

      <p>Please double-check the UTR number and verify that the payment went through. If you believe this is a mistake, please reach out to our support chat or reply directly to this email with a screenshot of your payment receipt.</p>
      
      <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 13px; color: #94a3b8;">
        Need help? Reply to this email or visit our Support Chat.
      </p>
    </div>
  `;

  const subject = `Payment Verification Failed - Order ${order.razorpayOrderId || order._id}`;

  if (smtpUser && smtpPass) {
    const sent = await sendMailViaVercelBridge(toEmail, subject, htmlContent);
    if (sent) return;
  }

  if (transporter) {
    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`Rejection email successfully sent to ${toEmail}`);
    } catch (error) {
      console.error('Error sending rejection email:', error.message);
    }
  } else {
    console.log('\n--- EMAIL SENT (REJECTION MOCK) ---');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: Payment Verification Failed - Order ${order.razorpayOrderId || order._id}`);
    console.log('-----------------------------------\n');
  }
};

/**
 * Send project update notification email to buyers
 * @param {string} toEmail - Recipient email
 * @param {string} userName - Buyer name
 * @param {Object} project - The project details
 */
export const sendUpdateNotificationEmail = async (toEmail, userName, project) => {
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #334155; line-height: 1.6;">
      <h2 style="color: #0ea5e9; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Project Update Available!</h2>
      <p>Hello ${userName},</p>
      <p>We are excited to inform you that a new update has been released for the project <strong>${project.title}</strong>, which you previously purchased.</p>
      
      <div style="margin: 20px 0; padding: 15px; background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 8px;">
        <p style="margin: 0;"><strong>Project:</strong> ${project.title}</p>
        <p style="margin: 5px 0 0 0;"><strong>Status:</strong> Update Available (Free Download)</p>
      </div>

      <p>You can download the latest files and release notes anytime from your personal dashboard on our website.</p>
      
      <div style="margin: 25px 0; text-align: center;">
        <a href="https://codewithkj.vercel.app/dashboard" style="background: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
      </div>

      <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 13px; color: #94a3b8;">
        Need help? Reply to this email or visit our Support Chat.
      </p>
    </div>
  `;

  const subject = `New Update Available: ${project.title}`;

  if (smtpUser && smtpPass) {
    const sent = await sendMailViaVercelBridge(toEmail, subject, htmlContent);
    if (sent) return true;
  }

  if (transporter) {
    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`Update notification email successfully sent to ${toEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending update email:', error.message);
      return false;
    }
  } else {
    console.log('\n--- EMAIL SENT (UPDATE NOTIFICATION MOCK) ---');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log('---------------------------------------------\n');
    return true;
  }
};

/**
 * Send cart recovery email
 * @param {string} toEmail - Recipient email
 * @param {string} htmlContent - HTML content of cart recovery
 */
export const sendRecoveryEmail = async (toEmail, htmlContent) => {
  const subject = "Complete your purchase and save 10%!";
  
  if (smtpUser && smtpPass) {
    const sent = await sendMailViaVercelBridge(toEmail, subject, htmlContent);
    if (sent) return true;
  }

  if (transporter) {
    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`Recovery email successfully sent to ${toEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending recovery email:', error.message);
      return false;
    }
  } else {
    console.log('\n--- EMAIL SENT (RECOVERY MOCK) ---');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log('----------------------------------\n');
    return true;
  }
};

/**
 * Send instant alert to Admin for Custom Project Request
 */
export const sendCustomProjectAdminAlert = async (details) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@marketplace.com';
  const subject = `🚀 NEW CUSTOM PROJECT: ${details.title} (₹${details.entryFee} Entry Fee Paid)`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 24px; color: #ffffff; text-align: center;">
        <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
          ⚡ Client Commission Request
        </span>
        <h1 style="margin: 10px 0 0 0; font-size: 24px; font-weight: 800;">New Custom Project Submitted!</h1>
        <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">₹${details.entryFee} Entry Fee Received via UPI</p>
      </div>

      <div style="padding: 24px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
            👤 Client Contact Details
          </h3>
          <p style="margin: 4px 0;"><strong>Name:</strong> ${details.name}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:${details.email}" style="color: #4f46e5;">${details.email}</a></p>
          <p style="margin: 4px 0;"><strong>WhatsApp/Phone:</strong> <a href="https://wa.me/91${details.phone.replace(/\D/g, '')}" target="_blank" style="color: #10b981; font-weight: bold;">${details.phone} (Chat on WhatsApp)</a></p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
            💼 Project Scope & Budget
          </h3>
          <p style="margin: 4px 0;"><strong>Project Title:</strong> ${details.title}</p>
          <p style="margin: 4px 0;"><strong>Category:</strong> ${details.category}</p>
          <p style="margin: 4px 0;"><strong>Tech Stack:</strong> ${details.techStack}</p>
          <p style="margin: 4px 0;"><strong>Target Budget:</strong> ₹${details.targetBudget || 'Negotiable'}</p>
          <p style="margin: 4px 0;"><strong>💸 Creator Payout UPI (Paise Bhejne Ke Liye):</strong> <code style="background: #e0e7ff; padding: 2px 6px; border-radius: 4px; color: #4338ca; font-weight: bold;">${details.payoutUpiId || details.clientUpiId || 'N/A'}</code></p>
          ${details.referenceLinks ? `<p style="margin: 4px 0;"><strong>📁 Project Files / Drive Link:</strong> <a href="${details.referenceLinks}" target="_blank" style="color: #2563eb; font-weight: bold;">${details.referenceLinks}</a></p>` : ''}
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0f172a;">📝 Detailed Requirements Description:</h3>
          <div style="background: #f1f5f9; padding: 14px; border-radius: 6px; font-size: 13.5px; line-height: 1.6; white-space: pre-wrap;">${details.description}</div>
        </div>

        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 6px 0; font-size: 14px; color: #065f46;">💳 ₹50 Entry Fee & UTR Verification</h3>
          <p style="margin: 4px 0; font-size: 13.5px;"><strong>Entry Fee:</strong> ₹${details.entryFee} Paid</p>
          <p style="margin: 4px 0; font-size: 13.5px;"><strong>UPI UTR Number:</strong> <code style="background: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #047857;">${details.utrNumber}</code></p>
        </div>

        <div style="text-align: center;">
          <a href="https://wa.me/91${details.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(details.name)},%20I%20reviewed%20your%20project%20request%20for%20${encodeURIComponent(details.title)}%20on%20ApexMarket." style="background: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; margin-right: 10px;">
            💬 Chat on WhatsApp
          </a>
          <a href="http://localhost:5174/admin" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            🛡️ Open Admin Panel
          </a>
        </div>
      </div>
    </div>
  `;

  if (smtpUser && smtpPass) {
    await sendMailViaVercelBridge(adminEmail, subject, html);
  } else if (transporter) {
    try {
      await transporter.sendMail({ from: smtpFrom, to: adminEmail, subject, html });
    } catch (e) {
      console.error('Failed to send custom project email to admin:', e.message);
    }
  } else {
    console.log(`[Custom Project Alert Sent to Admin ${adminEmail}]`);
  }
};

/**
 * Send confirmation receipt to client
 */
export const sendCustomProjectClientConfirmation = async (details) => {
  const subject = `✅ Project Request Received: ${details.title} - ApexMarket`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 24px; color: #ffffff; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">We Received Your Project Request!</h1>
        <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13.5px;">Your custom development inquiry is under review by Khushal Jangid</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 15px;">Hi <strong>${details.name}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
          Thank you for submitting your custom project requirements on <strong>ApexMarket</strong>. We have received your ₹${details.entryFee} entry fee payment from UPI ID: <code>${details.clientUpiId || 'N/A'}</code> (UTR: <code>${details.utrNumber}</code>).
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 18px 0;">
          <h4 style="margin: 0 0 6px 0; color: #0f172a;">📋 Summary of Request:</h4>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Title:</strong> ${details.title}</p>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Tech Stack:</strong> ${details.techStack}</p>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Proposed Budget:</strong> ₹${details.targetBudget || 'Negotiable'}</p>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Your UPI ID:</strong> ${details.clientUpiId || 'N/A'}</p>
        </div>

        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px; margin: 18px 0; font-size: 13px; color: #065f46;">
          <strong>⚡ Next Steps:</strong> Khushal will personally review your technical scope and reach out to you via WhatsApp (<strong>${details.phone}</strong>) or Email within 2-4 hours to discuss architecture, timeline, and kick-off.
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
          Need immediate assistance? Contact Khushal: <code>7303354598@omni</code> • Portfolio: webkhushal-nu.vercel.app
        </p>
      </div>
    </div>
  `;

  if (smtpUser && smtpPass) {
    await sendMailViaVercelBridge(details.email, subject, html);
  } else if (transporter) {
    try {
      await transporter.sendMail({ from: smtpFrom, to: details.email, subject, html });
    } catch (e) {
      console.error('Failed to send confirmation email to client:', e.message);
    }
  } else {
    console.log(`[Custom Project Confirmation Sent to Client ${details.email}]`);
  }
};

