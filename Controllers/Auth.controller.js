import User from "../models/user.model.js";

import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";

import dotenv from "dotenv"
dotenv.config()

import passwordRest from "../models/otp.models.js";
import { GenerateOTP, SendOtpEmail } from "../lib/email.service.js";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";





// for generating tokens
const generateTokens = (newUserId) => {

  const accessToken = jwt.sign({ newUserId }, process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "20m" }

  )

  const refreshToken = jwt.sign({ newUserId }, process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "7d"

    }
  )
  return { accessToken, refreshToken };
}

// for storing the refresh token in redis
const storeRefreshToken = async (newUserId, refreshToken) => {
  try {
    await redis.set(`refreshToken:${newUserId}`, refreshToken, "EX", 7 * 24 * 60 * 60)

  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log(error.message)

    } else {
      throw new Error("Internal server error")
    }
  }
}

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 22 * 60 * 1000


  })
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
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
    const { accessToken, refreshToken } = generateTokens(newUser._id)

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
    console.log("🔄 LOGIN ATTEMPT");

    // 🔍 Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ Invalid Email");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    console.log("✅ User Found:", user.email);

    console.log("🔑 Entered Password:", password);
    console.log("📁 Stored Hashed Password in DB:", user.password);

    // 🔄 Compare passwords
    const isMatch = await bcrypt.compare(password.trim(), user.password);
    console.log("🔍 Password Match:", isMatch);

    if (!isMatch) {
      console.log("❌ Password Does Not Match");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    console.log("✅ Password Matched!");

    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

  } catch (error) {
    console.log("❌ Error in Login:", error.message);
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



// for requesting otp
export const REQUEST_OTP = async (req, res) => {

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }
    const { email } = req.body;

    // 🔹 Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 🔹 Generate OTP
    const otp = GenerateOTP();

    // 🔹 Save OTP to database
    const newOtp = await passwordRest.create({ email, otp });
    await newOtp.save()


    // 🔹 Send OTP to user's email
    await SendOtpEmail(email, otp);
    res.json({ message: "OTP sent successfully" });


  } catch (error) {
    console.error("Request OTP Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });

  }
}



// for resetting password

export const RESET_PASSWORD = async (req, res) => {
  const { email, otp,oldPassword, newPassword } = req.body;
  try {
    console.log("🔄 RESET PASSWORD STARTED");

    // 🔍 Find OTP record
    const otpRecord = await passwordRest.findOne({ email, otp });
    if (!otpRecord) {
      console.log("❌ Invalid OTP");
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ⏳ Check if OTP expired
    const otpExpiryTime = otpRecord.createdAt.getTime() + parseInt(process.env.OTP_EXPIRY || 300000);
    if (Date.now() > otpExpiryTime) {
      console.log("❌ OTP Expired");
      return res.status(400).json({ message: "OTP expired" });
    }

    // 🔍 Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User Not Found");
      return res.status(404).json({ message: "User not found" });
    }

    // 🔄 Compare old password
    const isOldPasswordMatch = await bcrypt.compare(oldPassword.trim(), user.password);
if(!isOldPasswordMatch){
  console.log("❌ Old Password Does Not Match");
  return res.status(400).json({ message: "Old password does not match" });
}
// prevent Reuse of old password
if (user.previousPasswords) {
  for (let oldHashedPassword of user.previousPasswords) {
    if (await bcrypt.compare(newPassword, oldHashedPassword)) {
      return res.status(400).json({ message: 'New password must be different from the last 3 passwords' });
    }
  }
}

    // 🚀 Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword.trim(), salt);

    console.log("🔑 Generated Hashed Password:", hashedPassword);

    // Store New Password & Maintain Last 3 Passwords
user.previousPasswords = [...(user.previousPasswords || []).slice(-2), user.password];
user.password = hashedPassword;
user.passwordChangedAt = new Date();
    console.log("✅ User Found:", user.email);
    console.log("📝 Entered Password Before Hashing:", newPassword);


    // 🔄 Update user password
    await User.updateOne({ email }, { $set: { password: hashedPassword } });


    // 🔍 Check what is saved in DB
    const updatedUser = await User.findOne({ email });
    console.log("📁 Stored Hashed Password in DB:", updatedUser.password);

    // 🗑️ Delete OTP record
    await passwordRest.deleteOne({ email });
    console.log("✅ OTP Record Deleted");

    res.status(200).json({ message: "Password reset successfully, please login" });

  } catch (error) {
    console.error("❌ Reset Password Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// for getting user profile
export const PROFILE = async (req, res) => {

  console.log("profile controller")
}



