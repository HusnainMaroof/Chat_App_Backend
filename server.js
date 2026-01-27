import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import { config } from "./config/EnvConfig.js";
import cors from "cors";
import { app, server } from "./lib/socket.js";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorMiddleware.js";
import { connectDB } from "./config/connectDB.js";
import { userRouter } from "./routes/authRoutes.js";
import { connectRedis } from "./config/connectRedis.js";
import { chatRouter } from "./routes/chatRoutes.js";

dotenv.config();

let port = config.PORT;
let allowedOrigin = [
  config.FRONTEND_ORIGIN_ONE,
  config.FRONTEND_ORIGIN_TWO,
  config.FRONTEND_ORIGIN_THREE,
  config.FRONTEND_ORIGIN_FOUR,
];

connectDB();
connectRedis();
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigin.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Cors Blocked : origin Error not Allowd "));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.options('/*splat', cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use(errorHandler);
server.listen(port, () => console.log(`Server running on PORT: ${port}`.cyan));
