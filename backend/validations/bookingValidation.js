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

export const completeBookingParamsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'any.required': 'Thiếu mã lớp học',
    'number.base': 'Mã lớp học phải là số',
    'number.integer': 'Mã lớp học phải là số nguyên',
    'number.positive': 'Mã lớp học không hợp lệ',
  }),
});
