import jwt from "jsonwebtoken"
import { UserModel } from "../models/userModel.js"
import { client as redisClient } from "../config/connectRedis.js";
import { config } from "../config/EnvConfig.js";
let getCacheKey = (userId) => `user:profile:${userId}`;
const TTL_SECONDS = 86400;
export const socketAuthMiddleware = async (socket, next) => {

    try {

        const cookieHeader = socket.handshake.headers.cookie;
        let token

        if (!cookieHeader) {
            res.status(401)
            console.log("No Cookei founded")
            return next(new Error("TOKEN_MISSING"))
        }


        const extractCookie = Object.fromEntries(
            cookieHeader.split("; ").map((c) => c.split("="))
        )
        token = extractCookie.auth_cookie

        if (!token) {
            res.status(401)
            console.log("Socket connection rejected : no token Recived")
            return (next(new Error("Token Missing")))
        }


        const payload = await jwt.verify(token, config.JWT_SECRET, { algorithms: ["HS256"] })
        let userId = payload.id


        let user
        let cacheKey = getCacheKey(userId)
        let getCachedUser = await redisClient.get(cacheKey)

        if (getCachedUser) {
            console.log(`redis hit cashed user data for ${userId} from socket Middleware`);
            user = JSON.parse(getCachedUser)
        } else {

            let dbUser = await UserModel.findById(userId)
            if (dbUser || !dbUser.isVerified) {
                console.log("user not found in from socket middleware");
                return (next(new Error("In_Valid_User")))
            }
            user = dbUser
            let UserString = JSON.stringify(dbUser)

            await redisClient.set(cacheKey, UserString, { EX: TTL_SECONDS })
            console.log("Data cached for User From Socket Middleware");


        }


        socket.user = user
        next()

    } catch (error) {
        console.log("internal Server Error from socket Middleware ");
        next(new Error("TOKEN_MISSING"))

    }

}

