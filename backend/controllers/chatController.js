import chatService from '../services/chatService.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';

export const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const senderType = req.user.role === 'user' ? 'user' : 'tutor';
    const data = await chatService.sendMessage(senderId, senderType, req.body);
    return sendSuccess(res, 201, 'Thành công', { data });
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const myId = req.user.id;
    const myType = req.user.role === 'user' ? 'user' : 'tutor';
    const { partnerId, partnerType } = req.params;

    if (!partnerId || !partnerType) {
      throw new ApiError(400, 'Thiếu thông tin đối tác trò chuyện');
    }

    const data = await chatService.getMessages(myId, myType, partnerId, partnerType);
    return sendSuccess(res, 200, 'Thành công', { data });
  } catch (err) {
    next(err);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const myId = req.user.id;
    const myType = req.user.role === 'user' ? 'user' : 'tutor';
    const data = await chatService.getConversations(myId, myType);
    return sendSuccess(res, 200, 'Thành công', { data });
  } catch (err) {
    next(err);
  }
};
