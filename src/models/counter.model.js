import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

counterSchema.statics.encodeBase36 = function (num, length = 3) {
  return num.toString(36).toUpperCase().padStart(length, "0");
};

counterSchema.statics.generateCompactId = async function (prefix = "BN") {
  const counter = await this.findOneAndUpdate(
    { name: prefix },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  const code = this.encodeBase36(counter.value);
  return `${prefix}-${code}`;
};

const Counter = mongoose.model("Counter", counterSchema);

export default Counter;
