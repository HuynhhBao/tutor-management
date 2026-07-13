import Joi from 'joi';

export const createTutorSchema = Joi.object({
  fullName: Joi.string().required().messages({ 'any.required': 'Họ tên là bắt buộc' }),
  email: Joi.string().email().required().messages({ 'any.required': 'Email là bắt buộc', 'string.email': 'Email không hợp lệ' }),
  gender: Joi.string().valid('Nam', 'Nữ', 'Khác').required().messages({ 'any.required': 'Giới tính là bắt buộc' }),
  age: Joi.number().integer().min(18).required().messages({ 'any.required': 'Tuổi là bắt buộc', 'number.min': 'Tuổi phải từ 18 trở lên' }),
  subject: Joi.string().required().messages({ 'any.required': 'Môn học là bắt buộc' }),
  qualification: Joi.string().required().messages({ 'any.required': 'Trình độ là bắt buộc' }),
});

export const updateTutorSchema = createTutorSchema; // Same fields for update

export const updateTutorStatusSchema = Joi.object({
  tutorId: Joi.number().integer().required().messages({ 'any.required': 'ID gia sư là bắt buộc' }),
  status: Joi.string().valid('active', 'inactive', 'banned', 'Sẵn sàng nhận lớp', 'Tạm nghỉ').required().messages({ 'any.required': 'Trạng thái là bắt buộc', 'any.only': 'Trạng thái không hợp lệ' }),
});
