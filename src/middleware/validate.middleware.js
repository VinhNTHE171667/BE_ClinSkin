import { validationResult } from "express-validator";

export const validateMiddleWare = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
  success: false,
  message: "Dữ liệu không hợp lệ",
  errors: errors.array().map(err => ({ field: err.param, message: err.msg }))
});
  }
  next();
};
