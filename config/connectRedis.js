import { createClient } from 'redis';

let client = null;


export const connectRedis = async () => {
    // If the client is already initialized and open, exit early
    if (client && client.isOpen) {
        console.log("Redis client already connected.");
        return;
    }

    // --- Configuration (Read INSIDE the function) ---
    const host = process.env.REDIS_HOST;
    const userName = process.env.REDIS_USERNAME;
    const password = process.env.REDIS_PASSWORD;
    const port = process.env.REDIS_PORT;


    // Critical check: if variables are still missing, log the error and stop.
    if (!host || !password || !port) {
        console.error("❌ Redis Configuration Error: REDIS_HOST, REDIS_PORT, or REDIS_PASSWORD is missing in environment. Connection aborted.");
        return;
    }

    // --- Initialize the client only if it hasn't been yet ---
    if (!client) {
        client = createClient({
            username: userName,
            password: password,
            socket: {
                host: host,
                port: port
            },
            // Options for robustness
            socketNodelay: true,
            disableOfflineQueue: true,
        });

        // Set up the error listener
        client.on('error', err => {
            // Check if the error is the specific connection refused error
            if (err.code === 'ECONNREFUSED') {
                // Log the configured host and port (the external one), not the default 6379
                console.error(`\n❌ Redis Client Error: Connection Refused. The client attempted to connect to ${host}:${port.cyan}. 
Please verify the host/port/password and check network access to your Redis Labs instance.`);
            } else {
                console.error('Redis Client Error:', err.message);
            }
        });
    }

    // --- Connect ---
    try {
        await client.connect();
        console.log(`Successfully connected to Redis on ${host.america}:${port.cyan}.`);
    } catch (error) {
        // Log generic connection failure if client.on('error') didn't already handle it
        if (error.code !== 'ECONNREFUSED') {
            console.error(`Failed while attempting to connect to Redis.`, error.message);
        }
    }
}

// Export the client instance for use in controllers/services
export { client };