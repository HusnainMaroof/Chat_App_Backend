import { contactModel } from "../models/contactModel.js";
import { UserModel } from "../models/userModel.js";
import { client as redisClient } from "../config/connectRedis.js";

export const saveContact = async (req, res) => {
  const cacheKey = `contacts:${userId}`;

  let updateCachedContact = false;
  try {
    const { user } = req?.user;
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error("Receiver email is not Provided");
    }

    if (email === user.email) {
      res.status(409);
      throw new Error("You cannot Add your Own Email");
    }

    let contactUser = await UserModel.findOne({ email });

    if (!getuser) {
      res.status(404);
      throw new Error("This Contact user does not exist");
    }

    const userId = user._id;
    const receiverId = contactUser._id;

    // Check if current user already has a contacts document
    let contactDoc = await contactModel.findOne({ ownerUserId: userId });

    // this is contact data
    const contactData = {
      contactUserId: receiverId,
      ProfilePic: contactUser.profilePhoto,
      name: contactUser.userName,
      email: contactUser.email,
    };

    // if contact user dont have have any contact then make one
    if (!contactDoc) {
      contactDoc = await contactModel.create({
        ownerUserId: userId,
        contacts: [contactData],
      });
    } else {
      // now check if this contact is already exist in our contact list or not
      let isAlreadyAdded = contactDoc.contacts.some(
        (c) => String(c.contactUserId) === receiverId
      );

      //   if it is exist then throw error
      if (isAlreadyAdded) {
        res.status(409);
        throw new Error("This user is already in your contact list");
        return;
      }

      contactDoc.contacts.push(contactData);
      await contactDoc.save();
    }
    await redisClient.del(cacheKey);
    // Success response
    res.status(200);
    res.send("Contact has been saved");
  } catch (error) {
    // Fallback for unexpected errors if not handled by custom error middleware
    res.status(200).json({ message: error.message });
  }
};

// get related  Contacts

export const getContact = async (req, res) => {
  const userId = req.user.user?._id?.toString();

  const cacheKey = `contacts:${userId}`;
  const ONE_DAY_TTL = 86400;

  try {
    // 1. Try to fetch from Redis Cache
    const cachedContacts = await redisClient.get(cacheKey);

    if (cachedContacts) {
      console.log(`[Redis] Hit for userId: ${userId}`);
      return res.status(200).json(JSON.parse(cachedContacts));
    }

    // 2. Cache Miss - Fetch from MongoDB
    const myContactDoc = await contactModel
      .findOne({ ownerUserId: userId })
      .select(" -_id contacts");

    if (!myContactDoc) {
      return res
        .status(404)
        .json({ contacts: [], message: "No contacts found" });
    }
    // 3. Store in Redis for future requests
    await redisClient.set(cacheKey, JSON.stringify(myContactDoc), {
      EX: ONE_DAY_TTL,
    });

    console.log(`[Redis] Miss. Data cached for userId: ${userId}`);

    // 4. Send response
    return res.status(200).json(myContactDoc);
  } catch (error) {
    console.error("Error in getContact:".red, error);

    // Final fallback: If Redis fails, try to at least get DB data
    try {
      const dbData = await contactModel.findOne({ ownerUserId: userId });

      return res.status(200).json(dbData);
    } catch (dbError) {
      return res
        .status(500)
        .json({ error: "Server Error: Could not retrieve contacts." });
    }
  }
};

// notify related user

export const notifyRelatedUser = async (userId, status, userName) => {
  try {
    console.log(`[Pub/Sub] Publishing ${status} for ${userName}`);
    // Every user has their own channel: e.g., "status:654321"
    await redisClient.publish(
      `status:${userId}`,
      JSON.stringify({ userId, status })
    );
  } catch (error) {
    console.error(`Error publishing status:`, error);
  }
};
