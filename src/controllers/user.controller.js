import User from "../models/user.model.js";
import { uploadImage, deleteImage } from "../ultis/cloudinary.js";

// GET /users
export const getAllUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { search, status } = req.query;
    const skip = (page - 1) * pageSize;

    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("name email avatar isActive createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: page,
        totalPage: Math.ceil(total / pageSize),
        totalUsers: total,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Error in getAllUser:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách người dùng",
      error: error.message,
    });
  }
};

// PUT /users/:id
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, avatar, isActive, address } = req.body;

    const user = await User.findById(id).select("-password -__v");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

   
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;


    if (address && typeof address === "object") {
      user.address = {
        province: address.province || user.address?.province,
        district: address.district || user.address?.district,
        ward: address.ward || user.address?.ward,
        detail: address.detail || user.address?.detail,
      };
    }

   
    if (avatar) {
      if (typeof avatar === "string" && avatar.startsWith("data:image")) {
        // Nếu có avatar mới (base64), upload lên Cloudinary
        if (user.avatar?.publicId) {
          await deleteImage(user.avatar.publicId);
        }
        const uploaded = await uploadImage(avatar, "avatar");
        user.avatar = {
          publicId: uploaded.public_id,
          url: uploaded.url,
        };
      } else if (typeof avatar === "object" && avatar.url && avatar.publicId) {

        user.avatar = avatar;
      }
    }

    const savedUser = await user.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin người dùng thành công",
      data: savedUser,
    });
  } catch (error) {
    console.error("Error in updateUser:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật thông tin người dùng",
      error: error.message,
    });
  }
};


// DELETE /users/:id
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Xóa người dùng thành công",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy người dùng",
      error: error.message,
    });
  }
};
