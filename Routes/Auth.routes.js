import express from "express"
import { SIGNUP,LOGIN,LOGOUT } from "../Controllers/Auth.controller.js"

const router = express.Router()

router.get("/SIGNUP", SIGNUP)
router.get("/LOGIN", LOGIN)
router.get("/LOGOUT", LOGOUT)

export default router
