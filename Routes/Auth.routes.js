import express from "express"
import { SignUP,LogIn,Logout } from "../Controllers/Auth.controller.js"

const router = express.Router()

router.get("/SignUp", SignUP)
router.get("/LogIN", LogIn)
router.get("/LogOut", Logout)

export default router
