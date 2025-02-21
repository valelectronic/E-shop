import express from "express"
import { AuthUsers } from "../Controllers/Auth.controller.js"

const router = express.Router()

router.get("/", AuthUsers)

export default router