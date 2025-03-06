import User from "../models/user.model.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";

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
  
      // 🔹 Generate JWT Token
      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
  
      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          state: newUser.state,
          city: newUser.city,
          localGovernment: newUser.localGovernment,
        },
        token, // Return token for authentication
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