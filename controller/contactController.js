import { contactModel } from "../models/contactModel.js";
import { UserModel } from "../models/userModel.js";
import { client as redisClient } from "../config/connectRedis.js";

export const saveContact = async (req, res) => {
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

    if (!contactUser) {
      res.status(404);
      throw new Error("This Contact user does not exist");
    }

    const userId = user._id;
    const receiverId = contactUser._id;
    const contactCachedKey = `contacts:${userId}`;
    const contactSetKey = `contacts:set:${userId}`;

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
    await redisClient.del(contactCachedKey);
    await redisClient.del(contactSetKey);
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

  const contactCacheKey = `contacts:${userId}`;
  const contactSetKey = `contacts:set:${userId}`;
  const SEVEN_DAYS_TTL = 604800;
  try {
    let contactsData;
    let isCacheHit = false;
    // 1. Try to fetch from Redis Cache
    const cachedContacts = await redisClient.get(contactCacheKey);

    if (cachedContacts) {
      console.log(`[Redis] Hit for userId: ${userId}`);
      contactsData = JSON.parse(cachedContacts);
      isCacheHit = true;
    } else {
      // / 2. now get data form Moongo DB

      contactsData = await contactModel
        .findOne({ ownerUserId: userId })
        .select(" -_id contacts");

      // check even the contact is exist or not
      if (!contactsData) {
        return res
          .status(404)
          .json({ contacts: [], message: "No contacts found" });
      }
      // now cached this contacts as string in redis
      await redisClient.set(
        contactCacheKey,
        JSON.stringify(contactsData),
        "EX",
        SEVEN_DAYS_TTL
      );
      console.log(`[Redis] Miss. contact Data cached for userId: ${userId}`);
    }

    // now make only contact id in strings
    const contactIds = contactsData.contacts.map((c) =>
      c.contactUserId.toString()
    );

    // use redis multi to excute all at once
    const multi = redisClient.multi();

    multi.del(contactSetKey);

    // now cached only ids
    if (contactIds.length > 0) {
      multi.sAdd(contactSetKey, contactIds);
    }
    // set a expiry
    multi.expire(contactSetKey, SEVEN_DAYS_TTL);
    // now execute
    await multi.exec();

    return res.status(200).json(contactsData);
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

// this will check if the two users a has a conversation in between and  if there is new user then make has contact model overall
export const ensureMutualContact = async (senderId, recipientId) => {
  const recipientSetKey = `contacts:set:${recipientId}`;
  const SEVEN_DAYS_TTL = 604800;

  try {
    // first we check that the recipint user has cached set or not
    const exist = await redisClient.exists(recipientId);

    // if the recipient has cached set
    if (exist) {
      // now it will check in recipient set the sender exist or not
      const IsMember = await redisClient.sIsMember(recipientId, senderId);
      // if sender exist then return whcih means the sender is already contact of recipient
      if (IsMember) return false;
    }

    // now if  recipient set does not exist or sender is not a contact member
    //we will check that recipient has contact model or not
    const contactDoc = await contactModel.findOne({ ownerUserId: recipientId });

    if (contactDoc) {
      // if recipient has contact whcih redis cached must be expired then sync the redis

      const contactIds = contactDoc.contacts.map((c) =>
        c.contactUserId.toString()
      );
      if (contactIds.length > 0) {
        await redisClient.sAdd(recipientSetKey, contactIds);
        await redisClient.expire(recipientSetKey, SEVEN_DAYS_TTL);
      }

      // check if the sender is a contact or not

      const isAlreadyContact = contactIds.includes(senderId);
      if (isAlreadyContact) return false;
    }

    // now this means the sender has not in our contact list we need to add this in our contact list

    // now get sender profile from usermodel
    const senderUser = await UserModel.findById(senderId);
    if (!senderUser) return false;

    const contactData = {
      contactUserId: senderId,
      ProfilePic: senderUser.profilePhoto,
      name: senderUser.userName,
      email: senderUser.email,
    };

    // now check that even recipient has contact model or not

    if (!contactDoc) {
      await contactModel.create({
        ownerUserId: recipientId,
        contacts: [contactData],
      });
    } else {
      // if recipient has contact model then push this sender contact in our list

      contactDoc.contacts.push(contactData);
      await contactDoc.save();
    }

    // now updated the redis contact cached set

    await redisClient.sAdd(recipientSetKey, senderId);
    await redisClient.del(`contacts:${recipientId}`);

    // and finaly notifiy the recipient via pub/sub

    await redisClient.publish(
      `notifications:${recipientId}`,
      JSON.stringify({ type: "NEW_CONTACT", data: contactData })
    );
  } catch (error) {
    console.error("Error ensuring mutual contact:", error);
  }
};
