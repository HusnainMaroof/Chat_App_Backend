import { contactModel } from "../models/contactModel.js"
import { UserModel } from "../models/userModel.js"
import { client as redisClient } from "../config/connectRedis.js"


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

        let getuser = await UserModel.findOne({ email });

        if (!getuser) {
            res.status(404);
            throw new Error("This Contact user does not exist");
        }

        let receiverId = getuser._id.toString();
        let ownerId = user._id;

        const existingContactDoc = await contactModel.findOne({ ownerUserId: ownerId });
        if (existingContactDoc) {
            const isAlreadyAdded = existingContactDoc.contacts.some(
                (c) => String(c.contactUserId) === receiverId
            );

            if (isAlreadyAdded) {
                res.status(409)
                throw new Error("This user is already in your contact list")
                return

            }
        }

        // 1. First add the contact for the current user (Sender side)
        await ensureContact(ownerId, receiverId, email, getuser, existingContactDoc);

        // 2. Prepare sender info to pass to the receiver's list
        const senderInfo = {
            profilePhoto: user.profilePhoto,
            userName: user.userName,
            _id: user._id
        };

        // 3. Now add the contact for the receiver (Receiver side)
        await ensureContact(receiverId, ownerId, user?.email, senderInfo);

        // Success response
        res.status(200)
        res.send("Contact has been saved")
    } catch (error) {
        // Fallback for unexpected errors if not handled by custom error middleware
        const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
        res.status(statusCode).json({ message: error.message });
    }
};

export const ensureContact = async (ownerUserId, contactId, contactEmail, targetUser = null, existingDoc = null) => {
    const findTarget = targetUser || await UserModel.findById(contactId);
    if (!findTarget) return null;

    const cacheKey = `contacts:${ownerUserId}`;
    let updateCachedContact = false;

    const contactData = {
        contactUserId: contactId,
        ProfilePic: findTarget.profilePhoto,
        name: findTarget.userName,
        email: contactEmail
    };

    let contactDoc = existingDoc || await contactModel.findOne({ ownerUserId });

    if (!contactDoc) {
        await contactModel.create({
            ownerUserId,
            contacts: [contactData]
        });
        updateCachedContact = true;
    } else {
        const exists = contactDoc.contacts.some(
            (c) => String(c.contactUserId) === String(contactId)
        );

        if (!exists) {
            contactDoc.contacts.push(contactData);
            await contactDoc.save();
            updateCachedContact = true;
        }
    }

    // Clear Redis cache if an update occurred
    if (updateCachedContact) {
        try {
            await redisClient.del(cacheKey);
        } catch (redisError) {
            console.error("Redis Cache Clear Error:", redisError);
        }
    }

    return true;
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
            .findOne({ ownerUserId: userId }).select(" -_id contacts");

        if (!myContactDoc) {
            return res.status(404).json({ contacts: [], message: "No contacts found" });
        }
        // 3. Store in Redis for future requests
        await redisClient.set(cacheKey, JSON.stringify(myContactDoc), {
            EX: ONE_DAY_TTL
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
            return res.status(500).json({ error: "Server Error: Could not retrieve contacts." });
        }
    }
};



// notify related user


export const notifyRelatedUser = async (userId, status, userName) => {
    try {
        console.log(`[Pub/Sub] Publishing ${status} for ${userName}`);
        // Every user has their own channel: e.g., "status:654321"
        await redisClient.publish(`status:${userId}`, JSON.stringify({ userId, status }));
    } catch (error) {
        console.error(`Error publishing status:`, error);
    }
};
