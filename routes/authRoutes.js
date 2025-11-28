import express from "express"
import { regUser, reSendOtp, verfiyOtp } from "../controller/authController.js"



export const userRouter = express.Router()


userRouter.post("/user-register", regUser)
userRouter.post("/verfiy_otp", verfiyOtp)
userRouter.post("/reSend_Otp", reSendOtp)