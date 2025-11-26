import { UserModel } from "../models/userModel.js"
import otpGenrator from "otp-generator"
import bcrypt from "bcrypt"
export const regUser = async (req, res) => {
    const { email, password } = req.body



    if (!email || !password) {
        res.status(404)
        throw new Error("User Credentials not provided")
    }



    let checkEmail = await UserModel.findOne({ email })

    if (checkEmail) {
        res.status(409)
        throw new Error("Email already exists")


    }
    let hashPassword = bcrypt.hash(password, 10)

    let otp = otpGenrator.generate(4, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false, digits: true })

    const otpExpirtesAt = new Date(Date.now() + 10 * 60 * 1000)

    let createUser


}