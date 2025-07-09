import Admin from "../models/admin.model.js";
import bcrypt from "bcryptjs";

export const updateAccountAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      username,
      password,
      role,
      avatar,
      isActive,
      newPassword = "",
    } = req.body;
    const requestUser = req.admin;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản admin",
      });
    }

    if (username && username !== admin.username) {
      const existingAdmin = await Admin.findOne({ username });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: "Tên đăng nhập đã tồn tại",
        });
      }
    }

    const updateData = {
      name: name || admin.name,
      username: username || admin.username,
      avatar: avatar || admin.avatar,
    };

    if (requestUser.role === "ADMIN") {
      if (role) updateData.role = role;
      if (typeof isActive === "boolean") updateData.isActive = isActive;
    }

    if (newPassword) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập mật khẩu cũ để đổi mật khẩu mới",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Mật khẩu cũ không chính xác",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu mới phải có ít nhất 6 ký tự",
        });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    } else if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu phải có ít nhất 6 ký tự",
        });
      }

      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    return res.status(200).json({
      success: true,
      message: "Cập nhật tài khoản admin thành công",
      data: updatedAdmin,
    });
  } catch (error) {
    console.error("Update admin error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật tài khoản admin",
      error: error.message,
    });
  }
};