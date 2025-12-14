import { Server } from "socket.io";
import express from "express"
import colors from "colors"
import dotenv from "dotenv"
import { config } from "../config/EnvConfig.js";
dotenv.config()
import http from "http"
import cors from "cors"
import { socketAuthMiddleware } from "../middleware/socket.Auth.Middleware.js";

const app = express()

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: config.FRONTEND_ORIGIN,
        credentials: true
    }
})

io.use(socketAuthMiddleware);

const userSocketMap = {};

export const getReceiverSocketId = (userId) => {
    return userSocketMap[userId]
}


io.on("connection", (socket) => {



    let userId = socket.user._id
    let userName = socket.user.userName

    console.log(`User Connected ${userName}`);

    userSocketMap[userId] = userId;
    socket.join(userId)

    io.emit("getOnlineUsers", Object.keys(userSocketMap))
    console.log(userSocketMap);


    io.on("disconnect", () => {
        console.log("a user Disconnected:", userName);
        delete userSocketMap[userId]
        io.emit("getOnlineUsers", Object.keys(userSocketMap))

    })

})


export { io, app, server }


