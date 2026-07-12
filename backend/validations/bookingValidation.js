import Joi from 'joi';

export const createBookingSchema = Joi.object({
  tutorId: Joi.number().integer().required().messages({
    'any.required': 'Vui lòng chọn gia sư',
  }),
  subject: Joi.string().required().messages({
    'any.required': 'Vui lòng nhập môn học',
  }),
  scheduleTime: Joi.string().required().messages({
    'any.required': 'Vui lòng chọn thời gian',
  }),
  message: Joi.string().allow('', null),
});
