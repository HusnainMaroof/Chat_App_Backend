import mongoose from "mongoose";
import { config } from "./EnvConfig.js";

export const connectDB = async () => {
    const uri = config.MONGO.DB_URI
    if (!uri) console.log("Mongo Uri Missing ");

    try {
        await mongoose.connect(uri)
        console.log(`Database has been Host On : ${mongoose.connection.host.green}`);

    } catch (error) {
        console.log(error);

    }

}


