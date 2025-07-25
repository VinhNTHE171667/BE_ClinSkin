import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    pid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    province: {
      id: {
        type: Number,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    district: {
      id: {
        type: Number,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    ward: {
      id: {
        type: Number,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    products: {
      type: [itemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    address: {
      type: addressSchema,
      required: true,
    },
    addressDetail: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "picked_up",
        "in_transit",
        "carrier_confirmed",
        "failed_pickup",
        "delivery_pending",
        "carrier_delivered",
        "delivery_failed",
        "delivered_confirmed",
        "return",
        "return_confirmed",
        // "processing",
        // "shipping",
        // "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    note: {
      type: String,
      default: "KHÔNG CÓ",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "paypal", "stripe"],
      required: true,
    },
    cancelReason: {
      type: String,
      default: "",
    },
    stripeSessionId: {
      type: String,
      default: "",
    },
    codeShip: {
      type: String,
      default: "",
    },
    ship: {
      type: String,
      enum: ["normal", "express"],
      default: "normal",
    },
    statusHistory: [
      {
        type: {
          type: String,
          enum: ["normal", "shipping"],
          default: "normal",
        },
        note: {
          type: String,
          default: "",
        },
        prevStatus: String,
        status: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "statusHistory.updatedByModel",
        },
        updatedByModel: {
          type: String,
          enum: ["User", "Admin"],
        },
        date: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
