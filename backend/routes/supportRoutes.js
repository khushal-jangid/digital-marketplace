import express from 'express';
import {
  getMessages,
  sendMessage,
  getAdminChats,
  subscribeNewsletter,
  chatAdvisor,
  getSubscribers,
  deleteSubscriber,
  deleteUserChat,
  sendDirectEmail,
} from '../controllers/supportController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.post('/send-email', sendDirectEmail);
router.post('/subscribe', subscribeNewsletter);
router.post('/ai-chat', chatAdvisor);
router.get('/subscribers', protect, admin, getSubscribers);
router.delete('/subscribers/:id', protect, admin, deleteSubscriber);
router.delete('/chat/:userId', protect, admin, deleteUserChat);

router.route('/')
  .get(protect, getMessages)
  .post(protect, sendMessage);

router.get('/admin/chats', protect, admin, getAdminChats);

export default router;
