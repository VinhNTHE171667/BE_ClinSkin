import mongoose from "mongoose";

const connectDabase = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URL,
      {
        dbName: process.env.DB_NAME,
      }
    );
  } catch (error) {
    console.log(error);
  }
};

export default connectDabase;
