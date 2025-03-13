import Redis from "ioredis"
import dotenv from "dotenv"

dotenv.config()

const redisUrl = process.env.UPSTASH_REDIS_URL;

// Create Redis instance only if URL is available
export const redis = redisUrl ? new Redis(redisUrl) : null;

