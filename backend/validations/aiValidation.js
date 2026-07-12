import Joi from 'joi';

export const sendMessageToAISchema = Joi.object({
  message: Joi.string().trim().min(1).required().messages({
    'any.required': 'Nội dung tin nhắn không được để trống',
    'string.empty': 'Nội dung tin nhắn không được để trống',
  }),
});
