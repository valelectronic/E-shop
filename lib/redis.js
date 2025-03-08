import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redisUrl = new Redis(process.env.UPSTASH_REDIS_URL);

export const redis = new Redis(redisUrl);

redis.on("error", (err) => {
  console.log("⚠️ Redis connection error:", err.message);
});