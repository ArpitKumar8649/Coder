import express from 'express';
import { conversationController } from '../controllers/conversationController.js';

const router = express.Router();

router.post('/chat', conversationController.chat);
router.post('/chat/stream', conversationController.streamChat);
router.get('/history/:sessionId', conversationController.getHistory);
router.delete('/history/:sessionId', conversationController.clearHistory);

export default router;
