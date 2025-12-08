import mongoose from "mongoose";

const contactSchema = mongoose.Schema(
    {
        // This user "owns" this contact list
        ownerUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        contacts: [
            {
                // The other person this owner is talking to
                contactUserId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "users",
                    required: true,
                },

                ProfilePic: {
                    type: String,
                    default: null
                },
                name: {
                    type: String,
                    default: null
                },
                lastMessage: {
                    type: String,
                    trim: true,
                    maxlength: 2000,
                    default: null
                },
                // When was the last message sent
                lastMessageAt: {
                    type: Date,
                    default: null
                },
            },
        ],
    },
    { timestamps: true }
);

export const contactModel = mongoose.model("Contact", contactSchema);