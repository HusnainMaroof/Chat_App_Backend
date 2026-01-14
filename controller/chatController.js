import { client as redisClient } from "../config/connectRedis.js";
import { MessageModel } from "../models/messageModel.js";

const QUEUE_NAME = "message:queue";

export const startMessageWorker = async () => {
  console.log("🚀 Message Background Worker Started...".green);

  // Safety check: ensure the redisClient is initialized before duplicating
  // This prevents the "TypeError: Cannot read properties of null (reading 'duplicate')"
  if (!redisClient) {
    console.warn(
      "[Worker]: redisClient not ready, retrying in 5 seconds...".yellow
    );
    setTimeout(startMessageWorker, 5000);
    return;
  }

  try {
    // Create a dedicated client for the blocking pop operation
    const workerClient = redisClient.duplicate();
    await workerClient.connect();

    while (true) {
      try {
        // blPop waits indefinitely (0) until a message is pushed to the queue
        const result = await workerClient.blPop(QUEUE_NAME, 0);

        if (result) {
          const msg = JSON.parse(result.element);

          // Save individual message to MongoDB immediately
          await MessageModel.create({
            senderId: msg.senderId,
            recipientId: msg.recipientId,
            content: msg.content,
            status: "sent",
            createdAt: msg.createdAt,
          });

          console.log(
            `[Worker] Message saved to DB: ${msg.senderId} -> ${msg.recipientId}`
          );
        }
      } catch (error) {
        console.error("[Worker Loop Error]:", error);
        // Wait 5 seconds before retrying to avoid spamming errors if DB is down
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  } catch (initError) {
    console.error("[Worker Initialization Error]:", initError);
    // Retry initialization if it fails (e.g., Redis connection lost)
    setTimeout(startMessageWorker, 5000);
  }
};

export const getContactHistory = async (req, res) => {
  const userId = req.user.user._id;
  const { contactId } = req.params; // User they are chatting with

  if (!contactId) {
    return res.status(400).json({ message: "Contact ID is required" });
  }

  //this will give message accordingly whoes is the sender and recipient and sort them leatest first and limt only 100
  const message = await MessageModel.find({
    $or: [
      { senderId: userId, recipientId: contactId },
      { recipientId: userId, userId: contactId },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(100);

  res.status(200).json(message);
};
