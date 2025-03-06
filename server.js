import express from  "express"
import cors from "cors"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
// since export from router.js is default, it can be imported with different name 
import AuthRoutes from "./Routes/Auth.routes.js"
import { setupDB } from "./DB.setup.js"
 
dotenv.config()
 
// middleware
const app = express()
app.use(express.json()) // for parsing application/json
app.use(cookieParser())

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