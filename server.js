import express from  "express"
import cors from "cors"
import dotenv from "dotenv"
// since export from router.js is default, it can be imported with different name 
import AuthRoutes from "./Routes/Auth.routes.js"
 
dotenv.config()
 
// middleware
const app = express()
app.use(cors())
app.use(express.json())

// Api Routes 

app.use("/api/Auth", AuthRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, ()=>{
    console.log(` server is running on port ${PORT}`)
})