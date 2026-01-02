import express from "express"
import { auth_Me, login, logout, regUser, reSendOtp, ReSetPassowrdLink, ReSetPassword, updateProfile, verfiyOtp } from "../controller/authController.js"
import { protectRoute } from "../middleware/authMiddleware.js"



export const userRouter = express.Router()


userRouter.post("/user-register", regUser)
userRouter.post("/verfiy_otp", verfiyOtp)
userRouter.post("/reSend_Otp", reSendOtp)
userRouter.post("/reSet_Password_Link", ReSetPassowrdLink)
userRouter.post("/reSet_Password/:Link", ReSetPassword)
userRouter.post("/Login", login)
userRouter.put("/update_Profile", protectRoute, updateProfile)
userRouter.get("/auth_Me", protectRoute, auth_Me)
userRouter.post("/logout", protectRoute, logout)

