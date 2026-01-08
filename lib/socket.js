import { Server } from "socket.io";
import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import { config } from "../config/EnvConfig.js";
dotenv.config();
import cors from "cors";
import http from "http";
import { socketAuthMiddleware } from "../middleware/socket.Auth.Middleware.js";
import { client as redisClient } from "../config/connectRedis.js";
import {
  getContact,
  notifyRelatedUser,
} from "../controller/contactController.js";
import { contactModel } from "../models/contactModel.js";
const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

const ONLINE_USERS_KEY = "online:users";

io.on("connection", async (socket) => {
  let userId = socket?.user?._id?.toString();
  let userName = socket?.user?.userName;
  let sub = redisClient.duplicate();
  await sub.connect();
  const getContactCacheKey = `contacts:${userId}`;

  socket.join(userId);

  // add current user id in online user set
  await redisClient.sAdd(ONLINE_USERS_KEY, userId);

  // get user cached  Contact fom Redis

  //   const getCachedContact = await redisClient.get(getContactCacheKey);
  //   let allContact = JSON.parse(getCachedContact);

  //   // now just take all has ids and put them into an arry
  //   const contactIds = allContact
  //     ? allContact.contacts.map((c) => c.contactUserId.toString())
  //     : [];

  //     // now set current User id in online list
  // // now get all online user set
  //   const allOnline = await redisClient.sMembers(ONLINE_USERS_KEY);

  //   const onlineContactsForUser = contactIds.filter((id) =>
  //     allOnline.includes(id)
  //   );

  let getCC = await redisClient.sInter(
    `contacts:set:${userId}`,
    ONLINE_USERS_KEY
  );
  console.log(getCC);

  // emit the intial online user

  socket.emit("initalOnlineUser", getCC);

  // if (contactIds.length > 0) {
  //   const channel = contactIds.map((id) => `status:${id}`);

  //   await sub.subscribe(channel, (message) => {
  //     const data = JSON.parse(message);

  //     if (data.userId !== userId) {
  //       socket.emit("userStatusUpdate", data);
  //     }
  //     console.log(`[pub/sub] for ${userName}`);
  //   });
  // }

  // notify other user or updated user Status if he is oneline or not
  //basicaly pulish this user with this chanel
  // await notifyRelatedUser(userId, "online", userName);

  // disconnect
  socket.on("disconnect", async () => {
    console.log(`${userName} Disconnected`);

    await redisClient.sRem(ONLINE_USERS_KEY, userId.toString());
    await notifyRelatedUser(userId, "offline", userName);
    await sub.unsubscribe();
    await sub.quit();
  });
});

export { io, app, server };
