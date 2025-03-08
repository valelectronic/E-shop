import User from "../models/user.model.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";



// for generating tokens

const generateTokens = (newUserId)=>{
  
  const accessToken = jwt.sign({newUserId}, process.env.ACCESS_TOKEN_SECRET, 
    {expiresIn: "20m"}
  
  )
  
const refreshToken = jwt.sign({newUserId}, process.env.REFRESH_TOKEN_SECRET,
  {expiresIn: "7d"

  }
)
return {accessToken, refreshToken};
}

// for storing the refresh token in redis
const storeRefreshToken = async (newUserId, refreshToken)=>{
  try {
    await redis.set(`refreshToken:${newUserId}`, refreshToken, "EX", 7*24*60*60)
  
  } catch (error) {
    if(process.env.NODE_ENV === "development"){
      console.log(error.message)
    
  }else{
    throw new Error("Internal server error")
  }}}

  const setCookies = (res, accessToken, refreshToken)=>{
    res.cookie("accessToken", accessToken, {
      httpOnly: true, 
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 22*60*1000


    })
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, 
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7*24*60*60*1000
    })

  }

 // for registering a user
export const SIGNUP = async (req, res) => {
    try {
      const { name, email, password, state, city, localGovernment } = req.body;
  
      // 🔹 Validate required fields
      if (!name || !email || !password || !state || !city || !localGovernment) {
        return res.status(400).json({ message: "All fields are required" });
       
      }
      
      // 🔹 Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
  
      // 🔹 Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // 🔹 Create a new user 
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword, // Save hashed password
        state,
        city,
        localGovernment,
      });
 
      // 🔹 Authenticate use
      const {accessToken, refreshToken} = generateTokens( newUser._id)

      await storeRefreshToken(newUser._id, refreshToken)
      

      setCookies(res, {accessToken, refreshToken})
      


      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          state: newUser.state,
          city: newUser.city,
          role: newUser.role,
          localGovernment: newUser.localGovernment,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };


// for logging in a user
export const  LOGIN = async(req,res)=>{
res.send("log in successfully")
}



// for logging out a user
export const LOGOUT = async(req,res)=>{
res.send("log out successfully")
}