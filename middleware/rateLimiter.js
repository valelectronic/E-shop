import rateLimit from "express-rate-limit";

// 🔹 Limit requests: 5 per minute (adjust as needed)
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per window
  message: { message: "Too many attempts. Please try again later in the next 6 minutes ." },
  headers: true, // Send rate limit info in response headers
});