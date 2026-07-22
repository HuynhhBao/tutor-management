import aiService from '../services/aiService.js';
import { sendSuccess } from '../utils/response.js';

export const sendMessageToAI = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;
    const data = await aiService.sendMessageToAI(userId, message);
    return sendSuccess(res, 200, 'Thành công', { data });
  } catch (err) {
    next(err);
  }
};

export const getAIChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await aiService.getAIChatHistory(userId);
    return sendSuccess(res, 200, 'Thành công', { data });
  } catch (err) {
    next(err);
  }
};

export const clearAIChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await aiService.clearAIChatHistory(userId);
    return sendSuccess(res, 200, 'Đã xóa lịch sử chat AI thành công');
  } catch (err) {
    next(err);
  }
};

export const matchTutor = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const data = await aiService.getTutorRecommendations(prompt);
    return sendSuccess(res, 200, 'Gợi ý gia sư thành công', { data });
  } catch (err) {
    next(err);
  }
};


