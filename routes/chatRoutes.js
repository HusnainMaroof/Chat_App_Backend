import express from "express"
import { protectRoute } from "../middleware/authMiddleware.js"
import { getContact, saveContact } from "../controller/contactController.js"

export const chatRouter = express.Router()


chatRouter.post("/save-contact", protectRoute, saveContact)
chatRouter.get("/getMyContact", protectRoute, getContact)

