import express from 'express';
import { sendMessageToAI, getAIChatHistory, clearAIChatHistory } from '../controllers/aiController.js';
import validate from '../middlewares/validate.js';
import { sendMessageToAISchema } from '../validations/aiValidation.js';
import { verifyUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Chỉ học viên mới dùng AI
router.use(verifyUser);

router.post('/send', validate(sendMessageToAISchema), sendMessageToAI);
router.get('/history', getAIChatHistory);
router.delete('/history', clearAIChatHistory);

export default router;
