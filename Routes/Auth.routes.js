import express from "express"
import { SIGNUP,LOGIN,LOGOUT, PROFILE,REQUEST_OTP,RESET_PASSWORD,VERIFYEMAIL } from "../Controllers/Auth.controller.js"
 import { authLimiter} from "../middleware/rateLimiter.js"
const router = express.Router()

router.post("/SIGNUP",authLimiter, SIGNUP)
router.post("/LOGIN", LOGIN)
router.post("/LOGOUT", LOGOUT)
router.post("/REQUEST_OTP", REQUEST_OTP)
router.post("/RESET_PASSWORD",authLimiter, RESET_PASSWORD)
router.post("/VERIFYEMAIL",authLimiter, VERIFYEMAIL)
router.post("/PROFILE", PROFILE)


export default router
