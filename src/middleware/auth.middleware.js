import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const verifyToken = (token, secret) => jwt.verify(token, secret);

const findUserById = async (id) => User.findById(id).select("-password");

const handleAuthError = (res, status, message, data = "") =>
  res.status(status).json({ success: false, message, data });

export const authMiddlewareUser = async (req, res, next) => {
  try {
    const token = req.header("X-User-Header");
    if (!token) {
      return handleAuthError(res, 401, "Quyền truy cập bị từ chối");
    }
    const decoded = verifyToken(token, process.env.JWT_SECRET_KEY_USER);

    const user = await findUserById(decoded.id);
    if (!user) {
      return handleAuthError(res, 403, "Không có quyền truy cập");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return handleAuthError(res, 401, "Token không hợp lệ");
    }
    if (error.name === "TokenExpiredError") {
      return handleAuthError(res, 401, "Token đã hết hạn");
    }
    handleAuthError(res, 500, `Lỗi server: ${error.message}`);
  }
};