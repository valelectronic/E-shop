import express from  "express"
import cors from "cors"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
// since export from router.js is default, it can be imported with different name 
import AuthRoutes from "./Routes/Auth.routes.js"
import { setupDB } from "./lib/DB.setup.js"
  import helmet from "helmet"
  import rateLimit from "express-rate-limit"
  import mongoSanitize from "express-mongo-sanitize"
dotenv.config()
 
// Create express app
const app = express()

// middleware
app.use(mongoSanitize()) // Sanitize user input to prevent MongoDB injection
app.use(express.json()) // for parsing application/json
app.use(cookieParser())
const limiter = rateLimit({
  windowMs: 15*60*1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)
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