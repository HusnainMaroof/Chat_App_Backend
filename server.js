import express from "express"
import colors from "colors"
import dotenv from "dotenv"
import { config } from "./config/EnvConfig.js"
import cors from "cors"
import { app, server } from "./lib/socket.js"
import cookieParser from "cookie-parser"
import { errorHandler } from "./middleware/errorMiddleware.js"
import { connectDB } from "./config/connectDB.js"
import { userRouter } from "./routes/authRoutes.js"
import { connectRedis } from "./config/connectRedis.js"
import { chatRouter } from "./routes/chatRoutes.js"

dotenv.config()



let port = config.PORT
let origin = config.FRONTEND_ORIGIN

connectDB()
connectRedis()
app.use(cors({
    origin: origin,
    credentials: true
}))


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser())


app.use("/api/user", userRouter)
app.use("/api/chat", chatRouter)
app.use(errorHandler)
server.listen(port, () => console.log(`Server running on PORT: ${port}`.cyan))
