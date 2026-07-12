import Joi from 'joi';

export const sendMessageSchema = Joi.object({
  receiverId: Joi.number().integer().required().messages({
    'any.required': 'Vui lòng cung cấp ID người nhận',
  }),
  receiverType: Joi.string().valid('user', 'tutor').required().messages({
    'any.required': 'Vui lòng cung cấp loại người nhận (user/tutor)',
    'any.only': 'Loại người nhận chỉ có thể là user hoặc tutor',
  }),
  content: Joi.string().trim().min(1).required().messages({
    'any.required': 'Nội dung tin nhắn không được để trống',
    'string.empty': 'Nội dung tin nhắn không được để trống',
  }),
});
