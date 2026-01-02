import jwt from "jsonwebtoken";
import { UserModel } from "../models/userModel.js";
import { client as redisClient } from "../config/connectRedis.js";
import { config } from "../config/EnvConfig.js";

const getCacheKey = (userId) => `user:profile:${userId}`;
const TTL_SECONDS = 86400;

export const protectRoute = async (req, res, next) => {
    const cookieToken = req.cookies?.auth_cookie;
    const authHeader = req.headers?.authorization;

    let token;

    // Check Authorization header
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }

    // If not found in header, check cookie
    if (!token && cookieToken) {
        token = cookieToken;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!token) {
        res.status(401);
        throw new Error("TOKEN_MISSING");
    }

    try {
        const payload = await jwt.verify(token, config.JWT_SECRET, { algorithms: ["HS256"] })


        // set cashe

        const userId = payload.id
        const cacheKey = getCacheKey(userId)
        let user
        const getCachedUser = await redisClient.get(cacheKey)

        if (getCachedUser) {
            console.log(`[Redis Middleware] HIT for user ${userId}. Skipping DB lookup.`);
            user = JSON.parse(getCachedUser)

        } else {

            let dbUser = await UserModel.findById(payload.id)
            if (!dbUser || !dbUser.isVerified) {
                res.status(401)
                throw new Error("IN_VAILD_USER")

            }

            user = dbUser
            const userString = JSON.stringify(user)
            await redisClient.set(cacheKey, userString, { EX: TTL_SECONDS })
            console.log(`[Redis Middleware] Data cached for user ${userId}.`);
        }




        req.user = { user: user }

        return next()
    } catch (error) {
        res.status(500)
        console.log(error);
        throw new Error(`Middleware Error in Auth Middleware`)

    }
};


