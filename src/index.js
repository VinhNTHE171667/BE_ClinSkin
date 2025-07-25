import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/users/index.js";
import http from "http";
import cors from "cors";
import connectDabase from "./configs/database.js";
import adminRoutes from "./routes/admins/index.js";
import reviewRoutes from "./routes/admins/review.admin-route.js";
import morgan from "morgan";
import staffRoutes from "./routes/staffs/index.js";
import shippingRoutes from "./routes/shipping/index.js";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import { googleCallback } from "./controllers/auth.controller.js";
import { saveUser } from "./services/user.service.js";
import User from "./models/user.model.js";
import { app, server } from "./websocket/index.js";
import { initCronJobs } from "./cronjobs/stockUpdate.cron.js";

dotenv.config();

const PORT = process.env.PORT || 9999;
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan("dev"));
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

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL: "http://localhost:9999/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      await saveUser(profile, done);
    }
  )
);

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get("/api/v1/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
    if (info && info.isExist) {
      return res.redirect(
        `${process.env.FRONT_END_URL}/auth?error=already_registered`
      );
    }
    if (err) {
      console.log(err);
      return res.redirect(
        `${process.env.FRONT_END_URL}/auth?error=server_error`
      );
    }
    if (!user) {
      return res.redirect(
        `${process.env.FRONT_END_URL}/auth?error=google_auth_failed`
      );
    }
    req.logIn(user, (err) => {
      console.log("error", err);
      
      if (err) {
        return res.redirect(
          `${process.env.FRONT_END_URL}/auth?error=login_error`
        );
      }
      googleCallback(req, res, next);
    });
  })(req, res, next);
});

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => {
    done(null, user);
  });
});

app.use("/api/v1", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/admin/reviews", reviewRoutes);
app.use("/api/v1/admin", staffRoutes);
app.use("/api/v1/shipping", shippingRoutes);
server.listen(PORT, async () => {
  await connectDabase();
  
  initCronJobs();
  
  console.log(`🚀-------------SERVER RUN PORT ${PORT}-------------🚀`);
});