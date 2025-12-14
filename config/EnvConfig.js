import dotenv from "dotenv"
dotenv.config()



export const config = {
    // Application/Server Configuration
    PORT: process.env.PORT_NO || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',

    // Database Configuration (MongoDB)
    MONGO: {
        DB_USER_NAME: process.env.MONGOO_DB_USER_NAME,
        DB_PASS: process.env.MONGOO_DB_PASS,
        DB_URI: process.env.MONGOO_DB_URI,
    },

    // Security Configuration
    JWT_SECRET: process.env.JWT_SECRET,

    // Email Service Configuration (e.g., for Nodemailer)
    EMAIL: {
        PASS: process.env.EMAIL_PASS,
        // You might want to add EMAIL_USER (for the sender address) here as well
    },

    // Redis Configuration
    REDIS: {
        HOST: process.env.REDIS_HOST,
        PORT: process.env.REDIS_PORT,
        USERNAME: process.env.REDIS_USERNAME,
        PASSWORD: process.env.REDIS_PASSWORD,
    },

    // Cloudinary Configuration
    CLOUDINARY: {
        API_KEY: process.env.CLOUDINARY_API_KEY,
        API_SECRET: process.env.CLOUDINARY_API_SECRET,
        NAME: process.env.CLOUDINARY_NAME,
        // The URL is also available in case the SDK prefers it
        URL: process.env.CLOUDINARY_URL,
    }
};

