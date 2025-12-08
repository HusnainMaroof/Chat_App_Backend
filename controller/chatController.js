import express from "express"
import { contactModel } from "../models/contactModel.js"
import { UserModel } from "../models/userModel.js"




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
    const ownerSide = await ensureContact(onwerId, receiverId)
    const receiverSide = await ensureContact(receiverId, onwerId)

    res.status(200);
    res.send("contact has been saved")

}

export const ensureContact = async (ownerUserId, contactId) => {
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
            }]
        })
        return newOwner;
    }
    const exists = checkOwnerExist.contacts.some((c) => String(c.contactUserId) === contactId);

    if (!exists) {

        checkOwnerExist.contacts.push({
            contactUserId: contactId,
            ProfilePic,
            name,

        })

        await checkOwnerExist.save();

    }
    return checkOwnerExist
}