import Joi from 'joi';

const passwordRegex = /^(?=[^A-Z]*[A-Z])(?=[^!@#$%^&*(),.?":{}|<>]*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

export const registerSchema = Joi.object({
  email: Joi.string().email().custom((value, helpers) => {
    if (!value.endsWith('@gmail.com')) {
      return helpers.message('Email phải có định dạng @gmail.com');
    }
    return value;
  }).required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc',
  }),
  fullName: Joi.string().required().messages({
    'any.required': 'Họ tên là bắt buộc',
  }),
  password: Joi.string().pattern(passwordRegex).required().messages({
    'string.pattern.base': 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ in hoa và ký tự đặc biệt',
    'any.required': 'Mật khẩu là bắt buộc',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().required().messages({
    'any.required': 'Vui lòng nhập email',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Vui lòng nhập mật khẩu',
  }),
});

export const adminLoginSchema = Joi.object({
  username: Joi.string().required().messages({
    'any.required': 'Vui lòng nhập tên đăng nhập',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Vui lòng nhập mật khẩu',
  }),
});

export const tutorLoginSchema = adminLoginSchema;

export const updateProfileSchema = Joi.object({
  fullName: Joi.string().required().messages({
    'string.empty': 'Họ tên không được để trống',
    'any.required': 'Họ tên là bắt buộc',
  }),
  phoneNumber: Joi.string().allow('', null),
  currentGrade: Joi.string().allow('', null).optional(),
  gradeLevels: Joi.string().allow('', null).optional(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Vui lòng nhập mật khẩu hiện tại',
  }),
  newPassword: Joi.string().invalid(Joi.ref('currentPassword')).pattern(passwordRegex).required().messages({
    'any.invalid': 'Mật khẩu mới không được trùng với mật khẩu hiện tại',
    'string.pattern.base': 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ in hoa và ký tự đặc biệt',
    'any.required': 'Vui lòng nhập mật khẩu mới',
  }),
});
