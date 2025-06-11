import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/users/index.js";
import http from "http";
import cors from "cors";
import connectDabase from "./configs/database.js";
import adminRoutes from "./routes/admins/index.js";
import promotionsRoutes from "./routes/promotion/index.js";
import ProductRoutes from "./routes/product/index.js";

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
    ],
  })
);

app.use(express.json());
app.use("/api/v1", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/admin", promotionsRoutes);
app.use("/api/v1/admin", ProductRoutes);

server.listen(PORT, async () => {
  await connectDabase();
  console.log(`🚀-------------SERVER RUN PORT ${PORT}-------------🚀`);
});