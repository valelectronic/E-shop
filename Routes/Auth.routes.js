import express from "express"
import { SIGNUP,LOGIN,LOGOUT } from "../Controllers/Auth.controller.js"

const router = express.Router()

router.post("/SIGNUP", SIGNUP)
router.post("/LOGIN", LOGIN)
router.post("/LOGOUT", LOGOUT)

export default router
