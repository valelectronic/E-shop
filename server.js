import express from  "express"
import cors from "cors"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
// since export from router.js is default, it can be imported with different name 
import AuthRoutes from "./Routes/Auth.routes.js"
import { setupDB } from "./lib/DB.setup.js"
  import helmet from "helmet"
  import mongoSanitize from "express-mongo-sanitize"
  import {authLimiter} from "./middleware/rateLimiter.js"

dotenv.config()
 
// Create express app
const app = express()

// middleware
app.use(mongoSanitize()) // Sanitize user input to prevent MongoDB injection
app.use(express.json()) // for parsing application/json
app.use(cookieParser())
app.use( authLimiter) // Rate limiter to prevent brute force attacks


app.use(helmet()) // Set secure HTTP headers

app.use(
    cors({
      origin: ["e-shop-frontend-git-main-valelectronics-projects.vercel.app"], // Replace with your frontend URL
      credentials: true,
    })
  );
  


// Api Routes 

app.use("/api/Auth", AuthRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, ()=>{
    console.log(` server is running on port ${PORT}`)
    setupDB()
})