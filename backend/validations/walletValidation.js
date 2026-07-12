import Joi from 'joi';

export const depositSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': 'Số tiền nạp phải là số',
    'number.positive': 'Số tiền nạp không hợp lệ',
    'any.required': 'Vui lòng nhập số tiền nạp',
  }),
  paymentMethod: Joi.string().optional().allow(''),
});
