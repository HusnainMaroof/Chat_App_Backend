import express, { json } from "express"
import { contactModel } from "../models/contactModel.js"
import { UserModel } from "../models/userModel.js"
import { client as redisClient } from "../config/connectRedis.js"


export const saveContact = async (req, res) => {

    const { user } = req?.user
    const { email } = req.body

    if (!email) {
        res.status(400)
        throw new Error(" Reciver email is not Provided")
    }

    let getuser = await UserModel.findOne({ email });
    let receiverId = getuser._id.toString();
    let onwerId = user._id

    const ownerSide = await ensureContact(onwerId, receiverId, email)
    const receiverSide = await ensureContact(receiverId, onwerId, getuser?.email)

    res.status(200);
    res.send("contact has been saved")

}

export const ensureContact = async (ownerUserId, contactId, email) => {


    const cacheKey = `contacts:${ownerUserId}`;
    let updateCachedContact = false

    let checkOwnerExist = await contactModel.findOne({ ownerUserId })
    let findReciver = await UserModel.findById(contactId)


    let name = findReciver?.userName
    let ProfilePic = findReciver?.profilePhoto



    if (!checkOwnerExist) {
        let newOwner = await contactModel.create({
            ownerUserId,
            contacts: [{
                contactUserId: contactId,
                ProfilePic,
                name,
                email
            }]
        })

        updateCachedContact = true
    }
    const exists = checkOwnerExist.contacts.some((c) => String(c.contactUserId) === contactId);

    if (!exists) {

        checkOwnerExist.contacts.push({
            contactUserId: contactId,
            ProfilePic,
            name,
            email

        })

        await checkOwnerExist.save();
        updateCachedContact = true

    }

    if (updateCachedContact) {
        await redisClient.del(cacheKey)
    }
    return await contactModel.findOne({ ownerUserId })
}


// get Contacts

export const getContact = async (req, res) => {
    const { user } = req.user;

    const userId = user._id.toString()
    const cacheKey = `contacts:${userId}`;
    const ONE_DAY_TTL = 86400;

    try {
        const getCachedContact = await redisClient.get(cacheKey);


        if (getCachedContact) {
            console.log(`Redis Hit for Contact cached for ${userId}`);
            return res.status(200).send(JSON.parse(getCachedContact))
        }

        const getMyContact = await contactModel.findOne({ ownerUserId: userId })

        if (!getMyContact) {
            res.send(404)
            res.send({ contacts: [] })
        }

        const toCache = JSON.stringify(getMyContact)

        await redisClient.set(cacheKey, toCache, { "EX": ONE_DAY_TTL })
        console.log(`[Redis] Contact Data Hass been cashed for ${userId}`);

        res.send(getMyContact)

    } catch (error) {
        console.log("Error while geting cashed data from Redis For My Contact".red);
        try {
            const getMyContact = await contactModel.findOne({ ownerUserId: userId })
            res.send(getMyContact)
        } catch (error) {
            res.status(500).send("Server Error: Could not retrieve contacts.".red);
        }
    }


}
