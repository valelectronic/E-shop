import express from "express"
import { SIGNUP,LOGIN,LOGOUT, PROFILE,REQUEST_OTP,RESET_PASSWORD } from "../Controllers/Auth.controller.js"

const router = express.Router()

router.post("/SIGNUP", SIGNUP)
router.post("/LOGIN", LOGIN)
router.post("/LOGOUT", LOGOUT)
router.post("/REQUEST_OTP", REQUEST_OTP)
router.post("/RESET_PASSWORD", RESET_PASSWORD)
router.post("/PROFILE", PROFILE)


export default router
