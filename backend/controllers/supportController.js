import SupportMessage from '../models/SupportMessage.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Subscriber from '../models/Subscriber.js';
import { isDbConnected, mockDb } from '../config/mockDb.js';

/**
 * @desc    Get support messages for a user
 * @route   GET /api/support
 * @access  Private
 */
export const getMessages = async (req, res) => {
  const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user._id;

  try {
    if (!isDbConnected()) {
      const messages = mockDb.support.filter(m => m.user === userId);
      return res.json({ success: true, messages });
    }

    const messages = await SupportMessage.find({ user: userId })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Send a support message
 * @route   POST /api/support
 * @access  Private
 */
export const sendMessage = async (req, res) => {
  const { message, userId } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const targetUser = req.user.role === 'admin' && userId ? userId : req.user._id;
    const isAdmin = req.user.role === 'admin';

    if (!isDbConnected()) {
      const newMessage = {
        _id: `msg_mock_${Date.now()}`,
        user: targetUser,
        sender: {
          _id: req.user._id,
          name: req.user.name,
          role: req.user.role
        },
        message,
        isAdminReply: isAdmin,
        createdAt: new Date()
      };

      mockDb.support.push(newMessage);
      return res.status(201).json({ success: true, message: newMessage });
    }

    const newMessage = await SupportMessage.create({
      user: targetUser,
      sender: req.user._id,
      message,
      isAdminReply: isAdmin,
    });

    const populatedMessage = await newMessage.populate('sender', 'name role');

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all active user support chats (Admin only)
 * @route   GET /api/support/admin/chats
 * @access  Private/Admin
 */
export const getAdminChats = async (req, res) => {
  try {
    if (!isDbConnected()) {
      // Find unique user IDs in mockDb.support messages list
      const uniqueUserIds = [...new Set(mockDb.support.map(m => m.user))];
      const chats = uniqueUserIds.map(uid => {
        const userMessages = mockDb.support.filter(m => m.user === uid);
        const latest = userMessages[userMessages.length - 1];
        const userInfo = mockDb.users.find(u => u._id === uid);
        return {
          userId: uid,
          user: userInfo ? { name: userInfo.name, email: userInfo.email } : null,
          lastMessage: latest ? latest.message : '',
          lastMessageAt: latest ? latest.createdAt : new Date()
        };
      });

      return res.json({ success: true, chats });
    }

    const chatUsers = await SupportMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$user',
          lastMessage: { $first: '$message' },
          lastMessageAt: { $first: '$createdAt' },
        }
      },
      { $sort: { lastMessageAt: -1 } }
    ]);

    const chats = await Promise.all(
      chatUsers.map(async (chat) => {
        const userInfo = await User.findById(chat._id).select('name email');
        return {
          userId: chat._id,
          user: userInfo,
          lastMessage: chat.lastMessage,
          lastMessageAt: chat.lastMessageAt,
        };
      })
    );

    res.json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Subscribe to email newsletter (Public)
 * @route   POST /api/support/subscribe
 * @access  Public
 */
export const subscribeNewsletter = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    if (!isDbConnected()) {
      const alreadySubbed = mockDb.subscribers && mockDb.subscribers.some(s => s.email === email.toLowerCase());
      if (alreadySubbed) {
        return res.status(400).json({ success: false, message: 'You are already subscribed!' });
      }
      if (!mockDb.subscribers) mockDb.subscribers = [];
      mockDb.subscribers.push({ email: email.toLowerCase(), subscribedAt: new Date() });
      return res.status(201).json({ success: true, message: 'Awesome! Thank you for subscribing.' });
    }

    const alreadySubbed = await Subscriber.findOne({ email: email.toLowerCase() });
    if (alreadySubbed) {
      return res.status(400).json({ success: false, message: 'You are already subscribed!' });
    }

    await Subscriber.create({ email });
    res.status(201).json({ success: true, message: 'Awesome! Thank you for subscribing.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Serverless AI chat assistant (Public)
 * @route   POST /api/support/ai-chat
 * @access  Public
 */
export const chatAdvisor = async (req, res) => {
  const { message, history } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    // Fetch catalog projects dynamically to construct Gemini context
    let projectsList = [];
    if (!isDbConnected()) {
      projectsList = mockDb.projects;
    } else {
      projectsList = await Project.find({}, 'title description price category techStack');
    }

    const projectsSummary = projectsList.map(p => 
      `- Title: ${p.title}\n  Category: ${p.category}\n  Price: INR ${p.price}\n  Tech Stack: ${p.techStack.join(', ')}\n  Description: ${p.description}`
    ).join('\n\n');

    const systemPrompt = `You are "ApexAdvisor", the official AI Project Assistant for ApexMarket (a premium digital marketplace for developer templates and source codes).
Your purpose is to help buyers choose the best templates, explain the technologies they use, and recommend specific items from our catalog.

Here is the current catalog of available projects on ApexMarket:
${projectsSummary}

Rules:
1. Suggest specific project titles from the catalog. Do not recommend fake projects.
2. If a user asks for something we don't have, explain politely and suggest they submit a Custom Feature Request on the project details page!
3. Be professional, concise, and developer-friendly. Avoid long paragraphs. Format with markdown if helpful.

Conversation History:
${history ? history.map(h => `${h.sender === 'user' ? 'User' : 'Advisor'}: ${h.text}`).join('\n') : ''}
User: ${message}
Advisor:`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      });
      
      const responseData = await response.json();
      const reply = responseData?.candidates?.[0]?.content?.parts?.[0]?.text || 'I am having trouble processing that right now. Please try again.';
      return res.json({ success: true, reply });
    }

    // Smart local fallback if GEMINI_API_KEY is not defined
    const userQuery = message.toLowerCase();
    let reply = "Hello! I am ApexAdvisor, your AI project assistant. How can I help you find the right source code template today?";
    
    if (userQuery.includes('chat') || userQuery.includes('socket')) {
      const chatProj = projectsList.find(p => p.title.toLowerCase().includes('chat') || p.description.toLowerCase().includes('chat'));
      reply = chatProj 
        ? `I highly recommend the **${chatProj.title}**! It's a premium MERN template using WebSockets for real-time collaboration. It costs INR ${chatProj.price} and uses: ${chatProj.techStack.join(', ')}.`
        : "We have awesome MERN templates that utilize WebSocket connections. Go to the /projects page to browse the details!";
    } else if (userQuery.includes('aws') || userQuery.includes('lambda') || userQuery.includes('serverless')) {
      const awsProjs = projectsList.filter(p => p.techStack.some(t => t.toLowerCase().includes('aws') || t.toLowerCase().includes('lambda')));
      if (awsProjs.length > 0) {
        reply = `For serverless or AWS pipelines, we have: ${awsProjs.map(p => `\n- **${p.title}** (INR ${p.price})`).join('')}. They come with complete S3 triggers and API Gateway configs!`;
      } else {
        reply = "We offer cloud infrastructure templates including AWS Serverless pipelines. Check our /projects directory for IaC scripts!";
      }
    } else if (userQuery.includes('kubernetes') || userQuery.includes('docker') || userQuery.includes('terraform')) {
      const devopsProjs = projectsList.filter(p => p.techStack.some(t => t.toLowerCase().includes('kubernetes') || t.toLowerCase().includes('docker') || t.toLowerCase().includes('terraform')));
      if (devopsProjs.length > 0) {
        reply = `For containerization & DevOps, I recommend: ${devopsProjs.map(p => `\n- **${p.title}** (INR ${p.price})`).join('')}. They include complete docker-compose and Terraform scripts!`;
      }
    } else if (userQuery.includes('coupon') || userQuery.includes('discount')) {
      reply = "Yes! You can see active offers in the banner at the top of the page. You can also solve our daily 'Spot the Bug' challenge on the homepage to earn a 10% coupon instantly!";
    } else {
      reply = `I am ApexAdvisor! We offer premium production-ready codes like ${projectsList.slice(0, 3).map(p => `**${p.title}**`).join(', ')} and more. What tech stack (React, Node, AWS, Python) are you looking to build with?`;
    }

    res.json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all newsletter subscribers (Admin only)
 * @route   GET /api/support/subscribers
 * @access  Private/Admin
 */
export const getSubscribers = async (req, res) => {
  try {
    if (!isDbConnected()) {
      const subs = (mockDb.subscribers || []).map(s => {
        const u = mockDb.users.find(usr => usr.email.toLowerCase() === s.email.toLowerCase());
        return {
          _id: s._id || `sub_mock_${s.email}`,
          email: s.email,
          createdAt: s.subscribedAt || s.createdAt || new Date(),
          user: u ? { name: u.name } : null
        };
      });
      return res.json({ success: true, count: subs.length, subscribers: subs });
    }

    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    
    // Map and try to find matching user name for each email
    const populatedSubscribers = await Promise.all(subscribers.map(async (sub) => {
      const matchedUser = await User.findOne({ email: sub.email }).select('name');
      return {
        _id: sub._id,
        email: sub.email,
        createdAt: sub.createdAt,
        user: matchedUser ? { name: matchedUser.name } : null
      };
    }));

    res.json({ success: true, count: populatedSubscribers.length, subscribers: populatedSubscribers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Unsubscribe / delete subscriber (Admin only)
 * @route   DELETE /api/support/subscribers/:id
 * @access  Private/Admin
 */
export const deleteSubscriber = async (req, res) => {
  const { id } = req.params;

  try {
    if (!isDbConnected()) {
      mockDb.subscribers = (mockDb.subscribers || []).filter(s => s.email !== id && s._id !== id);
      return res.json({ success: true, message: 'Subscriber removed successfully' });
    }

    const sub = await Subscriber.findById(id);
    if (!sub) {
      return res.status(404).json({ success: false, message: 'Subscriber not found' });
    }

    await sub.deleteOne();
    res.json({ success: true, message: 'Subscriber removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete support chat / tickets for a user (Admin only)
 * @route   DELETE /api/support/chat/:userId
 * @access  Private/Admin
 */
export const deleteUserChat = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!isDbConnected()) {
      mockDb.support = mockDb.support.filter(m => m.user !== userId);
      return res.json({ success: true, message: 'Support chat ticket deleted successfully' });
    }

    await SupportMessage.deleteMany({ user: userId });
    res.json({ success: true, message: 'Support chat ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Send direct email from website to owner (khushaljangra721@gmail.com)
 * @route   POST /api/support/send-email
 * @access  Public
 */
export const sendDirectEmail = async (req, res) => {
  const { name, email, subject, message } = req.body;
  const senderEmail = email || req.user?.email;
  const senderName = name || req.user?.name || 'Website Visitor';

  if (!message || !subject || !senderEmail) {
    return res.status(400).json({ success: false, message: 'Please provide email, subject, and message.' });
  }

  try {
    const targetOwnerEmail = 'khushaljangra721@gmail.com';

    // Store in SupportMessage DB if connected
    if (isDbConnected()) {
      try {
        await SupportMessage.create({
          user: req.user?._id || undefined,
          message: `[DIRECT WEBSITE EMAIL] From: ${senderName} (${senderEmail})\nSubject: ${subject}\n\n${message}`,
          isAdminReply: false,
        });
      } catch (err) {
        console.error('Support message save note:', err.message);
      }
    }

    // 1. Try sending via Vercel mail bridge first (guaranteed 100% delivery without Render port throttling)
    try {
      const vercelRes = await fetch((process.env.VERCEL_MAILER_URL || process.env.CLIENT_URL || 'https://apexmarketstore.vercel.app') + '/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetOwnerEmail,
          subject: `[ApexMarket Support] ${subject} (${senderName})`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <h2 style="color: #4f46e5; margin-top: 0;">New Support Message from Website</h2>
              <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                <p style="margin: 0 0 6px 0;"><strong>Sender:</strong> ${senderName} &lt;${senderEmail}&gt;</p>
                <p style="margin: 0;"><strong>Subject:</strong> ${subject}</p>
              </div>
              <p><strong>Message:</strong></p>
              <div style="background: #fdfdfd; padding: 14px; border-radius: 8px; border: 1px dashed #cbd5e1; white-space: pre-wrap;">${message}</div>
            </div>
          `,
        }),
      });
      const vData = await vercelRes.json();
      if (vData.success) {
        if (senderEmail && senderEmail.includes('@')) {
          await fetch((process.env.VERCEL_MAILER_URL || process.env.CLIENT_URL || 'https://apexmarketstore.vercel.app') + '/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: senderEmail,
              subject: `Support Request Received: ${subject}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                  <h2 style="color: #10b981; margin-top: 0;">We've Received Your Support Request!</h2>
                  <p>Hello ${senderName || 'Developer'},</p>
                  <p>Thank you for reaching out to ApexMarket Support. We have received your inquiry regarding <strong>"${subject}"</strong> and our technical team is reviewing it.</p>
                  <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #166534; font-size: 13px;">We typically respond within a few hours. You can reply directly to this email if you have any additional details.</p>
                  </div>
                  <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                    ApexMarket Help Desk • khushaljangra721@gmail.com
                  </p>
                </div>
              `,
            }),
          }).catch(() => {});
        }

        return res.status(200).json({
          success: true,
          message: 'Your message has been dispatched directly to khushaljangra721@gmail.com!',
        });
      }
    } catch (_) {}

    // 2. Direct SMTP fallback
    const nodemailer = (await import('nodemailer')).default;
    const activeUser = process.env.SMTP_USER || process.env.EMAIL_USER || 'khushaljangra721@gmail.com';
    const activePass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || 'vhlb tlrl iulw lqdi').replace(/["'\s]/g, '');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: activeUser,
        pass: activePass,
      },
    });

    // 1. Email to Admin
    await transporter.sendMail({
      from: `"${senderName}" <${activeUser}>`,
      replyTo: senderEmail,
      to: targetOwnerEmail,
      subject: `[ApexMarket Support] ${subject} (${senderName})`,
      text: `From: ${senderName} (${senderEmail})\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #4f46e5; margin-top: 0;">New Support Message from Website</h2>
          <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
            <p style="margin: 0 0 6px 0;"><strong>Sender:</strong> ${senderName} &lt;${senderEmail}&gt;</p>
            <p style="margin: 0;"><strong>Subject:</strong> ${subject}</p>
          </div>
          <p><strong>Message:</strong></p>
          <div style="background: #fdfdfd; padding: 14px; border-radius: 8px; border: 1px dashed #cbd5e1; white-space: pre-wrap;">${message}</div>
        </div>
      `,
    });

    // 2. Acknowledgment to Customer
    if (senderEmail && senderEmail.includes('@')) {
      await transporter.sendMail({
        from: `"ApexMarket Support" <${activeUser}>`,
        to: senderEmail,
        subject: `Support Request Received: ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #10b981; margin-top: 0;">We've Received Your Support Request!</h2>
            <p>Hello ${senderName || 'Developer'},</p>
            <p>Thank you for reaching out to ApexMarket Support. We have received your inquiry regarding <strong>"${subject}"</strong> and our technical team is reviewing it.</p>
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
              <p style="margin: 0; color: #166534; font-size: 13px;">We typically respond within a few hours. You can reply directly to this email if you have any additional details.</p>
            </div>
            <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
              ApexMarket Help Desk • khushaljangra721@gmail.com
            </p>
          </div>
        `,
      }).catch(() => {});
    }

    console.log(`\n========================================\n[EMAIL DISPATCHED TO: ${targetOwnerEmail}]\nFROM: ${senderName} (${senderEmail})\nSUBJECT: ${subject}\nMESSAGE: ${message}\n========================================\n`);

    res.status(200).json({
      success: true,
      message: 'Your message has been dispatched directly to khushaljangra721@gmail.com!',
    });
  } catch (error) {
    console.error('Direct email delivery error:', error.message);
    res.status(500).json({ success: false, message: 'Email dispatch error: ' + error.message });
  }
};

