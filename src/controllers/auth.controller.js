import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import { generateOTP } from "../ultis/generateOTP.js";
import { sendEmail } from "../configs/mail.js";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET_KEY_USER,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const handleLoginResponse = (user, token) => {
  return {
    success: true,
    accessToken: token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
    },
  };
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({
        success: false,
        message: "Thông tin đăng nhập không chính xác",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng xác thực tài khoản",
        data: {
          verify: false,
          email,
        },
      });
    }

    const token = generateToken(user);
    return res.status(200).json(handleLoginResponse(user, token));
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Có lỗi xảy ra khi đăng nhập",
    });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email đăng ký đã tồn tại",
      });
    }
    const newUser = new User({
      name,
      email,
      password,
      avatar: {
        url: `https://avatar.iran.liara.run/username?username=${name}`,
        publicId: "",
      },
    });
    const otp = generateOTP();
    const expirationTime = Date.now() + 5 * 60 * 1000;
    const newOtp = new Otp({
      email,
      otp,
      exp: Math.floor(expirationTime / 1000),
    });
    await Promise.all([newUser.save(), newOtp.save()]);
    sendEmail({ name: newUser.name, email, verificationCode: otp });
    res.status(201).json({
      success: true,
      message:
        "Đăng ký tài khoản thành công. Vui lòng kiểm tra email để xác thực OTP.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Có lỗi xảy ra khi đăng ký tài khoản",
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { otp, email } = req.body;
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mã OTP",
      });
    }

    const otpRecord = await Otp.findOne({
      email,
      otp: parseInt(otp),
    });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Mã OTP không hợp lệ",
      });
    }
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > otpRecord.exp) {
      return res.status(400).json({
        success: false,
        message: "Mã OTP đã hết hạn",
      });
    }
    await Promise.all([
      User.findOneAndUpdate({ email }, { isActive: true }),
      Otp.deleteOne({ _id: otpRecord._id }),
    ]);
    return res.status(200).json({
      success: true,
      message: "Xác thực OTP thành công",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Có lỗi xảy ra khi xác thực",
    });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email không tồn tại trong hệ thống",
      });
    }
    await Otp.deleteMany({ email });
    const otp = generateOTP();
    const expirationTime = Date.now() + 5 * 60 * 1000;
    const newOtp = new Otp({
      email,
      otp,
      exp: Math.floor(expirationTime / 1000),
    });
    await newOtp.save();
    sendEmail({ name: user.name, email, verificationCode: otp });
    res.status(200).json({
      success: true,
      message: "OTP đã được gửi tới email",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Có lỗi xảy ra khi yêu cầu mã OTP",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      email,
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Thông tin người dùng không tồn tại",
      });
    }
    user.password = password;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Có lỗi xảy ra khi tạo mật khẩu",
    });
  }
};

export const getAccountUser = async (req, res) => {
  try {
    const userDetails = await User.findById(req.user._id).select(
      "-password -__v"
    );
    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "Vui lòng đăng nhập",
      });
    }
    return res.status(200).json({
      success: true,
      data: userDetails,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      data: {},
      message: "Lỗi server: " + error.message,
    });
  }
};