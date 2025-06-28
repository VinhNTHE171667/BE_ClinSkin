import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema({
    province: { type: String, required: true },
    district: { type: String, required: true },
    ward: { type: String, required: true },
    detail: { type: String}
}, { _id: false });

export const UserSchema = new mongoose.Schema(
    {
        googleId: {
            type: String,
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            default: "",
        },
        avatar: {
            url: {
                type: String,
                default: "",
            },
            publicId: {
                type: String,
                default: "",
            },
        },
        phone: {
            type: String,
            unique: true,
            match: [/^[0-9]{10}$/, "Số điện thoại phải gồm đúng 10 chữ số (0–9), không chứa chữ hoặc ký tự đặc biệt."],
        },
        address: {
            type: addressSchema,
            required: true
        },
        isActive: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

UserSchema.pre("save", function (next) {
    if (!this.isModified("password")) return next();
    bcrypt.hash(this.password, 10, (err, hash) => {
        if (err) return next(err);
        this.password = hash;
        next();
    });
});

const User = mongoose.model("User", UserSchema);

export default User;
