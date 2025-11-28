import { UserModel } from "../models/userModel.js"
import otpGenrator from "otp-generator"
import crypto from "crypto"
import bcrypt from "bcrypt"
import { sentOtp } from "../lib/sendOTP.js"
import jwt from "jsonwebtoken"
import path from "path"

export const regUser = async (req, res) => {
    try {
        const { userName, email, password } = req.body



        if (!userName || !email || !password) {
            res.status(400)
            throw new Error("User Credentials not provided")
        }



        let checkEmail = await UserModel.findOne({ email })

        if (checkEmail) {
            res.status(409)
            throw new Error("Email already exists")


        }
        let hashPassword = await bcrypt.hash(password, 10)

        let otp = otpGenrator.generate(4, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false, digits: true })

        const otpExpirtesAt = new Date(Date.now() + 60 * 60 * 1000)

        let createUser = await UserModel.create({
            userName, email, password: hashPassword, otp: { code: otp, expiresAt: otpExpirtesAt }
        })


        sentOtp(email, otp)


        const SignUpSessionID = crypto.randomBytes(32).toString("base64url")

        createUser.signupSession = { id: SignUpSessionID, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
        let user = await createUser.save()

        res.cookie("signup_session", SignUpSessionID, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 10 * 60 * 1000,
        })


        res.send(user)
    } catch (error) {

        res.status(500)
        throw new Error(`Inernal Server in Reg_user Controler ${error}`)
    }


}


export const verfiyOtp = async (req, res) => {
    const { otp } = req.body

    const signUpCookie = req.cookies?.signup_session;
    if (!signUpCookie) {
        res.status(401)
        throw new Error("No_SIGNUP_SESSSION")
    }

    if (!otp) {
        res.status(401)
        throw new Error("OTP IS MISSING_CODE")
    }
    const user = await UserModel.findOne({
        "signupSession.id": signUpCookie,
        "signupSession.expiresAt": { $gt: new Date() }
    })


    if (!user) {
        res.status(401)
        throw new Error("SESSION_EXPIRED")
    }

    const now = Date.now();
    if (!user?.otp?.code || user?.otp?.expiresAt <= now) {
        res.status(401)
        throw new Error("OTP_EXPIRED")

    }


    let correctOtp = String(otp).trim()


    if (!user?.otp?.code === correctOtp) {
        res.status(401)
        throw new Error("INVALID_OTP")
    }


    user.isVerified = true;
    user.signupSession.id = undefined;
    user.signupSession.expiresAt = undefined;
    user.otp.expiresAt = undefined;
    user.otp.code = undefined;
    let response = await user.save()
    res.clearCookie("signup_session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",

    })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("auth_cookie", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: '/',
        maxAge: 7 * 24 * 60 * 60,

    })

    res.send({
        userName: response.userName,
        email: response.email,
        profileVerified: response.profileVerified,
        isVerified: response.isVerified
    })



}


export const login = async (req, res) => {
    try {

        const { email, password } = req.body
        if (!email || !password) {
            res.status(400)
            throw new Error("Email and password are required");
        }

        let getUser = await UserModel.findOne({ email })

        if (!getUser) {
            res.status(404)
            throw new Error("invalid Credentials ")
        }


        if (getUser?.email !== email) {
            res.status(401)
            throw new Error("Invalid  Email")
        }

        let checkPass = await bcrypt.compare(password, getUser?.password)

        if (!checkPass) {
            res.status(401)
            throw new Error("Invalid  pass")
        }


        let tooken = jwt.sign({ id: getUser?._id }, process.env.JWT_SECRET, { expiresIn: "7d" })


        res.cookie("auth_tooken", tooken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60

        })


    } catch (error) {
        res.status(500)
        throw new Error(`Inernal Server in Login Controler ${error}`)
    }


}


export const reSendOtp = async (req, res) => {
    try {
        const SignUpSessionID = req.cookies?.signup_session;


        if (!SignUpSessionID) {
            res.status(401)
            throw new Error("NO_SIGNUP_SESSION")
        }

        let getUser = await UserModel.findOne({
            "signupSession.id": SignUpSessionID,
            "signupSession.expiresAt": { $gt: new Date() }
        })

        if (!getUser) {
            res.status(401)
            throw new Error("SESSION_EXPIRED")


        }



        getUser.otp.code = null
        getUser.otp.expiresAt = null
        getUser.signupSession.expiresAt = null
        getUser.signupSession.id = null

        let newotp = otpGenrator.generate(4, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
            digits: true,
        });

        const newExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
        const NewSignUpSessionID = crypto.randomBytes(32).toString("base64url")
        sentOtp(getUser?.email, newotp)
        getUser.otp.code = newotp
        getUser.otp.expiresAt = newExpiresAt
        getUser.signupSession.id = NewSignUpSessionID


        let newUser = await getUser.save()
        res.cookie("signup_session", NewSignUpSessionID, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: newExpiresAt
        })


        res.send({
            email: newUser?.email,
            otp: newUser?.otp?.code
        })
    } catch (error) {
        res.status(500)
        throw new Error(`Inernal Server in ReSentOtp Controler ${error}`)
    }
}



export const reSetPassword = async (req, res) => {

    const { email } = req.body

    if (!email) {
        res.status(404)
        throw new Error("Email not provided")
    }
    const getUser = await UserModel.findOne({ email })


    if (!getUser) {
        res.status(404)
        throw new Error("user not Exsited")
    }

}