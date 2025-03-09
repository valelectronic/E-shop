import User from "../models/user.model.js";

import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";

import dotenv from "dotenv"
dotenv.config()



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
  
  
      // 🔹 Create a new user 
      const newUser = await User.create({
        name,
        email,
        password, // Save hashed password
        state,
        city,
        localGovernment,
      });
 
      // 🔹 Authenticate use
      const {accessToken, refreshToken} = generateTokens( newUser._id)

      await storeRefreshToken(newUser._id, refreshToken)
      

      setCookies(res, accessToken, refreshToken)
      

// 🔹 Send response after successful registration
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
  export const LOGIN = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
  
      if (user && (await user.comparePassword(password))) {
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);
  
        res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        });
      } else {
        res.status(400).json({ message: "Invalid email or password" });
      }
    } catch (error) {
      console.log("Error in login controller", error.message);
      res.status(500).json({ message: error.message });
    }
  };

//for logging out user
export const LOGOUT = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.cookies.accessToken?.refreshToken;

    if (!refreshToken || refreshToken === "undefined") {
      return res.status(400).json({ message: "No refresh token found in cookies" });
    }
    try {
      const decoded = jwt.decode(refreshToken);
      if (!decoded) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      const verified = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      
      await redis.del(`refreshToken:${verified.newUserId}`);
    } catch (error) {

      return res.status(401).json({ message: "Invalid refresh token" });
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out successfully" });

  } catch (error) {
    console.error("Logout Error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



