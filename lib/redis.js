import Redis from "ioredis"
import dotenv from "dotenv"

dotenv.config()



const redisUrl = process.env.UPSTASH_REDIS_URL;

if (!redisUrl) {
  console.warn("⚠️ UPSTASH_REDIS_URL is not set. Redis will not work.");
}

// Create Redis instance only if URL is available
export const redis = redisUrl ? new Redis(redisUrl) : null;

if (redis) {
  redis.on("error", (err) => {
    console.error("❌ Redis connection error:", err.message);
  });

  redis.on("connect", () => {
    console.log("✅ Connected to Upstash Redis!");
  });
} else {
  console.warn("⚠️ Redis is disabled because UPSTASH_REDIS_URL is missing.");
}
