import Address from "../models/address.model.js";

// Lay danh sach dia chi
export const getAllAddress = async (req, res) => {
  try {
    const addresses = await Address.find().lean().exec();
    return res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Co loi xay ra khi lay danh sach dia chi",
      error: error.message,
    });
  }
};


// Tao dia chi
export const createAddress = async (req, res) => {
  try {
    const addressData = req.body;

    // Nếu địa chỉ mới được đặt làm mặc định
    if (addressData.isDefault) {
      // Bỏ mặc định của tất cả địa chỉ khác
      await Address.updateMany({ isDefault: true }, { isDefault: false });
    }

    const newAddress = new Address(addressData);
    const savedAddress = await newAddress.save({ validateBeforeSave: false });

    return res.status(201).json({
      success: true,
      message: "Tạo địa chỉ thành công",
      data: savedAddress,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Cap nhat dia chi
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Nếu địa chỉ được đặt làm mặc định
    if (updateData.isDefault) {
      // Bỏ mặc định của tất cả địa chỉ khác (trừ địa chỉ hiện tại)
      await Address.updateMany(
        { _id: { $ne: id }, isDefault: true },
        { isDefault: false }
      );
    }

    const updatedAddress = await Address.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      message: "Cap nhat dia chi thanh cong",
      data: updatedAddress,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Co loi xay ra khi cap nhat dia chi",
      error: error.message,
    });
  }
};

// Thêm endpoint riêng để set default
export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    // Bỏ mặc định của tất cả địa chỉ
    await Address.updateMany({ isDefault: true }, { isDefault: false });

    // Đặt địa chỉ được chọn làm mặc định
    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      { isDefault: true },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Đặt địa chỉ mặc định thành công",
      data: updatedAddress,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi đặt địa chỉ mặc định",
      error: error.message,
    });
  }
};

// Xoa dia chi
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await Address.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "Xoa dia chi thanh cong",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Co loi xay ra khi xoa dia chi",
      error: error.message,
    });
  }
};
