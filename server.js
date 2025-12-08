import express from "express"
import colors from "colors"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
import { errorHandler } from "./middleware/errorMiddleware.js"
import { connectDB } from "./config/connectDB.js"
import { userRouter } from "./routes/authRoutes.js"
import { connectRedis } from "./config/connectRedis.js"
import { chatRouter } from "./routes/chatRoutes.js"
dotenv.config()


const app = express()

let port = process.env.PORT_NO
let origin = process.env.FRONTEND_ORIGIN

connectDB()
connectRedis()
app.use(cors({
    origin: origin,
    credentials: true
}))


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())


app.use("/api/user", userRouter)
app.use("/api/chat", chatRouter)
app.use(errorHandler)
app.listen(port, () => console.log(`Server running on PORT: ${port}`.cyan))
