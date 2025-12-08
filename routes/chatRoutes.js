import express from "express"
import { protectRoute } from "../middleware/authMiddleware.js"
import { saveContact } from "../controller/chatController.js"

export const chatRouter = express.Router()


chatRouter.post("/save-contact", protectRoute,saveContact)