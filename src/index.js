import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/users/index.js";
import http from "http";
import cors from "cors";
import connectDabase from "./configs/database.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: process.env.FRONT_END_URL,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-User-Header",
      "X-Admin-Header",
      "X-Doctor-Header",
    ],
  })
);

app.use(express.json());
app.use("/api/v1", userRoutes);

server.listen(PORT, async () => {
  await connectDabase();
  console.log(`🚀-------------SERVER RUN PORT ${PORT}-------------🚀`);
});