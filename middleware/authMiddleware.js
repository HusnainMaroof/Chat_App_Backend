import jwt from "jsonwebtoken";
import { UserModel } from "../models/userModel.js";

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

    if (!token) {
        res.status(401);
        throw new Error("TOKEN_MISSING");
    }

    try {
        const payload = await jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] })
        const user = await UserModel.findById(payload.id)
        if (!user || !user.isVerified) {
            res.status(401)
            throw new Error("IN_VAILD_USER")

        }

        req.user = { user: user }

        return next()
    } catch (error) {
        res.status(500)
        throw new Error(`Middleware Error in Auth Middleware ${error}`)
    }
};
