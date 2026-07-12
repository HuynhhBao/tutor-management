import Joi from 'joi';

export const sendApplyOtpSchema = Joi.object({
  email: Joi.string().email().custom((value, helpers) => {
    if (!value.endsWith('@gmail.com')) {
      return helpers.message('Chỉ chấp nhận email @gmail.com');
    }
    return value;
  }).required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Vui lòng nhập email',
  }),
});

export const approveApplicationSchema = Joi.object({
  interviewTime: Joi.string().required().messages({
    'any.required': 'Vui lòng cung cấp thời gian phỏng vấn',
  }),
  interviewAddress: Joi.string().required().messages({
    'any.required': 'Vui lòng cung cấp địa điểm phỏng vấn',
  }),
});

export const grantAccountSchema = Joi.object({
  username: Joi.string().required().messages({
    'any.required': 'Vui lòng cung cấp tên tài khoản',
  }),
});
