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
            default: null,
            trim: true,
        },

        bio: {
            type: String,
            default: null,
            trim: true,
            maxlength: 160,
        },
        profilePhoto: {
            type: String,
            default: null,
        },
        otp: {
            code: {
                type: String, default: null,
            },
            expiresAt: {
                type: Date, default: null,
            },
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        profileVerified: {
            type: Boolean,
            default: false,
        },
        signupSession: {
            id: {
                type: String,
                default: null
            },
            expiresAt: { type: Date, default: null },
        },
    },
    { timestamps: true }
);

export const UserModel = mongoose.model("User", UserSchema);
