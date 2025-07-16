import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "ADMIN",
      enum: ["ADMIN", "STAFF", "SUPPORT"],
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

AdminSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  bcrypt.hash(this.password, 10, (err, hash) => {
    if (err) return next(err);
    this.password = hash;
    next();
  });
});

const Admin = mongoose.model("Admin", AdminSchema);

export const initializeAdmin = async () => {
  const adminCount = await Admin.countDocuments({
    role: "ADMIN",
  });
  if (adminCount === 0) {
    const defaultAccounts = [
      {
        name: "Admin ClinSkin",
        username: "admin",
        password: "admin123",
        role: "ADMIN",
        avatar: {
          url: `https://avatar.iran.liara.run/username?username=admin`,
          publicId: "",
        },
      },
      {
        name: "Staff ClinSkin",
        username: "staff",
        password: "staff123",
        role: "STAFF",
        avatar: {
          url: `https://avatar.iran.liara.run/username?username=staff`,
          publicId: "",
        },
      }
    ];
    for (const account of defaultAccounts) {
      const newUser = new Admin(account);
      await newUser.save();
    }
  }
};

export default Admin;
