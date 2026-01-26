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
  ensureMutualContact,
  getContact,
  notifyRelatedUser,
} from "../controller/contactController.js";
import { contactModel } from "../models/contactModel.js";
import {
  sendUserNotification,
  startMessageWorker,
} from "../controller/chatController.js";
const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);
export const STATUS_KEY = (id) => `status:${id}`;
const ONLINE_USERS_KEY = "online:users";
const MESSAGE_QUEUE_KEY = "message:queue";

startMessageWorker();
io.on("connection", async (socket) => {
  let userId = socket?.user?._id?.toString();
  let userName = socket?.user?.userName;
  let sub = redisClient.duplicate();
  await sub.connect();
  const ContactCacheKey = `contacts:${userId}`;
  const contactSetKey = `contacts:set:${userId}`;

  socket.join(userId);

  // add current user id in online user set
  await redisClient.sAdd(ONLINE_USERS_KEY, userId);

  // get all the contact ids from from cached contact ids
  const contactids = await redisClient.sMembers(contactSetKey);
  // get all online user from global online set
  const allOnlineUser = await redisClient.sMembers(ONLINE_USERS_KEY);

  //filter out all the online users
  let onlinecontact = contactids.filter((id) => allOnlineUser.includes(id));
  //

  // emit the intial online user

  socket.emit("initalOnlineUser", onlinecontact);

  // these channel to subcribes
  const statusChannel = contactids.map((id) => `status:${id}`);
  const messageChannel = `message:${userId}`;
  const notificationChannel = `notifications:${userId}`;

  // .............subscribe all these channels
  const allChannel = [...statusChannel, messageChannel, notificationChannel];

  if (allChannel.length > 0) {
    await sub.subscribe(allChannel, (message, channel) => {
      const data = JSON.parse(message);

      if (channel.startsWith("status:")) {
        socket.emit("userStatusUpdate", data);
      } else if (channel === messageChannel) {
        socket.emit("receiveMessage", data);
      } else if (channel === notificationChannel) {
        socket.emit("newNotification", data);
      }
    });
  }

  // this is Send message Listner

  socket.on("sendMessage", async (payload) => {
    // thses all coming from user who send message
    const { recipientId, content, tempId, status, timestamp } = payload;

    try {
      const messageData = {
        senderId: userId,
        recipientId,
        content,
        timestamp,
        tempId,
      };
      // //publish the message with reciver id using redis pub/sub
      await redisClient.publish(
        `message:${recipientId}`,
        JSON.stringify(messageData),
      );
      // //this is for frontend to handel wehter the sms is send or not
      socket.emit("messageSent", { tempId, status: "sent" });

      // db data
      const dbMessage = {
        senderId: userId,
        recipientId,
        content,
        status: "sent",
        timestamp,
      };

      // send notification

      await sendUserNotification(recipientId, "New_Message", { messageData });

      // now save this message in redis queue with sender and reciver Ids
      await redisClient.rPush(MESSAGE_QUEUE_KEY, JSON.stringify(dbMessage));
      try {
        await ensureMutualContact(userId, recipientId);
      } catch (error) {
        console.log(error);
      }
    } catch (error) {
      console.log(error);
      socket.emit("error", "Message not sended");
    }
  });

  // notify other user or updated user Status if he is oneline or not
  //basicaly pulish this user with this chanel
  await notifyRelatedUser(userId, "online", userName);

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
