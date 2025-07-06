import express from "express";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config({});
import http from "http";
import { handleNotificationEvents } from "./handlers/notificationHandle.js";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONT_END_URL,
    credentials: true,
  },
});

//Connect socket
io.on("connection", (client) => {
  const userId = client.handshake.query.userId;
  const userType = client.handshake.query.userType;

  if (
    !userId ||
    !userType ||
    !["admin", "customer"].includes(userType)
  ) {
    client.disconnect();
    return;
  }

  client.userId = userId;
  client.userType = userType;

  console.log(`User connected: ${client.userId} (${client.userType})`);

  handleNotificationEvents(io, client);

  //Disconnect socket
  client.on("disconnect", () => {
    console.log(`User disconnected: ${client.userId}`);
  });
});

export { io, app, server };
