import { createClient } from "redis";
import { config } from "./EnvConfig.js";

let client = null;

export const connectRedis = async () => {
  if (client && client.isOpen) return console.log("Redis already connected");

  const { HOST, USERNAME, PASSWORD, PORT } = config.REDIS;
  if (!HOST || !PORT || !PASSWORD) {
    console.error("Redis config missing. Aborting.");
    return;
  }

  if (!client) {
    client = createClient({
      username: USERNAME || undefined,
      password: PASSWORD,
      socket: {
        host: HOST,
        port: PORT,
        reconnectStrategy: (retries) => {
          console.warn(`Redis reconnect attempt #${retries}`);
          return Math.min(retries * 100, 3000); // wait 100ms, 200ms, 300ms... max 3s
        },
        // Optional but recommended
        keepAlive: 5000, // prevent idle socket timeout
        noDelay: true,
      },
    });

    client.on("error", (err) => {
      console.error("Redis Client Error:", err.code, err.message);
      // Optionally: handle specific codes
      if (err.code === "ECONNRESET")
        console.warn("Connection was reset. Retrying...");
    });

    client.on("connect", () => console.log("Redis connected"));
    client.on("ready", () => console.log("Redis ready"));
    client.on("end", () => console.warn("Redis connection closed"));
  }

  try {
    await client.connect();
  } catch (err) {
    console.error("Redis failed to connect:", err.message);
  }
};

export { client };
