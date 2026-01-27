import mongoose from "mongoose";
import { client as redisClient } from "../config/connectRedis.js";
import { MessageModel } from "../models/messageModel.js";
import { contactModel } from "../models/contactModel.js";

const QUEUE_NAME = "message:queue";

export const startMessageWorker = async () => {
  if (!redisClient) {
    setTimeout(startMessageWorker, 5000);
    return;
  }

  try {
    const workerClient = redisClient.duplicate();
    await workerClient.connect();
    console.log("🚀 Message & Contact Worker Connected".green);

    while (true) {
      try {
        // 1. Pull message from Redis Queue
        const result = await workerClient.blPop(QUEUE_NAME, 0);

        if (result) {
          const msg = JSON.parse(result.element);

          // 2. Save the message history to MongoDB
          await MessageModel.create({
            senderId: msg.senderId,
            recipientId: msg.recipientId,
            content: msg.content,
            status: "sent",
            createdAt: msg.timestamp,
          });

          // 3. Update Sidebar Previews in MongoDB (Bulk Update)
          const previewText =
            msg.content.text || (msg.content.image ? "Image" : "New Message");

          await contactModel.bulkWrite([
            {
              // Update Sender's view of the recipient
              updateOne: {
                filter: {
                  ownerUserId: msg.senderId,
                  "contacts.contactUserId": msg.recipientId,
                },
                update: {
                  $set: {
                    "contacts.$.lastMessage": previewText,
                    "contacts.$.lastMessageAt": msg.timestamp,
                  },
                },
              },
            },
            {
              // Update Recipient's view of the sender
              updateOne: {
                filter: {
                  ownerUserId: msg.recipientId,
                  "contacts.contactUserId": msg.senderId,
                },
                update: {
                  $set: {
                    "contacts.$.lastMessage": previewText,
                    "contacts.$.lastMessageAt": msg.timestamp,
                  },
                },
              },
            },
          ]);

          // 4. CLEAR REDIS CACHE (Best Approach)
          // We delete the stringified contact list for both users.
          // The next time they call 'getContact', the API will fetch fresh data from DB.
          const senderCacheKey = `contacts:${msg.senderId}`;
          const recipientCacheKey = `contacts:${msg.recipientId}`;

          await redisClient.del([senderCacheKey, recipientCacheKey]);

          console.log(
            `[Worker] DB Updated & Cache Cleared: ${msg.senderId} <-> ${msg.recipientId}`,
          );
        }
      } catch (err) {
        console.error("Worker Loop Error:", err);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  } catch (err) {
    console.error("Worker Init Error:", err);
    setTimeout(startMessageWorker, 5000);
  }
};

// get contact history
export const getContactHistory = async (req, res) => {
  const userId = req.user.user._id;
  const { contactId } = req.params; // User they are chatting with

  if (!contactId) {
    return res.status(400).json({ message: "Contact ID is required" });
  }

  const contactObjectId = new mongoose.Types.ObjectId(contactId);

  // this will give message accordingly whoes is the sender and recipient and sort them leatest first and limt only 100
  const messages = await MessageModel.find({
    $or: [
      { senderId: userId, recipientId: contactObjectId },
      { senderId: contactObjectId, recipientId: userId },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json(messages);
};

export const sendUserNotification = async (recipientId, type, payload) => {
  try {
    const channel = `notifications:${recipientId}`;
    const notificationData = {
      type, // e.g., 'NEW_MESSAGE', 'NEW_CONTACT', 'SYSTEM_ALERT'
      data: payload,
      timestamp: new Date(),
    };

    await redisClient.publish(channel, JSON.stringify(notificationData));
  } catch (error) {
    console.error(
      `[Notification Error] Failed to send ${type} to ${recipientId}:`,
      error,
    );
  }
};
