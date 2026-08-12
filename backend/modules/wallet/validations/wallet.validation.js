import Joi from 'joi';

export const depositSchema = Joi.object({
  amount: Joi.number().min(10000).required().messages({
    'number.min': 'Số tiền nạp tối thiểu là 10.000đ',
    'any.required': 'Vui lòng nhập số tiền nạp',
  }),
  paymentMethod: Joi.string().valid('VNPAY', 'MOMO', 'BANK').default('VNPAY'),
});

export const withdrawSchema = Joi.object({
  amount: Joi.number().min(50000).required().messages({
    'number.min': 'Số tiền rút tối thiểu là 50.000đ',
    'any.required': 'Vui lòng nhập số tiền rút',
  }),
  description: Joi.string().allow('').optional(),
});
