import Joi from 'joi';
import { ApiError } from '../utils/ApiError.js';

const validate = (schema) => (req, res, next) => {
  const validSchema = Joi.compile(schema);
  const object = req.body;

  const { value, error } = validSchema.validate(object, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(400, errorMessage));
  }

  Object.assign(req, value);
  return next();
};

export default validate;
