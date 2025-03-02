import express from "express"
import { SignUP } from "../Controllers/Auth.controller.js"

const router = express.Router()

router.get("/", SignUP)

export default router
