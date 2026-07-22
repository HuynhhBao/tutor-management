import Joi from 'joi';

export const sendMessageToAISchema = Joi.object({
  message: Joi.string().trim().min(1).required().messages({
    'any.required': 'Nội dung tin nhắn không được để trống',
    'string.empty': 'Nội dung tin nhắn không được để trống',
  }),
});

export const matchmakerSchema = Joi.object({
  prompt: Joi.string().trim().min(1).required().messages({
    'any.required': 'Vui lòng nhập mô tả nhu cầu tìm gia sư',
    'string.empty': 'Vui lòng nhập mô tả nhu cầu tìm gia sư',
  }),
});

