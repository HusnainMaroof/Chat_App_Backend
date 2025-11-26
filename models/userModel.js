import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            // select: false, so password doesn't show by default in queries
        },

        country: {
            type: String,
            required: true,
            trim: true,
        },

        bio: {
            type: String,
            default: "",
            trim: true,
            maxlength: 160,
        },
        profilePhoto: {
            type: String,
        },
        otp: {
            code: { type: String, select: false },
            expiresAt: { type: Date, select: false },
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const UserModel = mongoose.model("User", UserSchema);
