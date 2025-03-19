import User from "../models/user.model.js"
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";
import dotenv from "dotenv"
dotenv.config()
import EmailVerification from "../models/emailVerification.model.js";
import passwordRest from "../models/otp.models.js";
import { GenerateOTP, SendOtpEmail,SendEmail, VerifyEmailWithOtp } from "../lib/email.service.js";
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

//send  OTP to user before registration 
export const VERIFYEMAIL = async (req, res) => {
  try {
  
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

      // 🔹 Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

    // 🔹 Send OTP
    const otpResponse = await VerifyEmailWithOtp(email);
    if (!otpResponse.success) {
      return res.status(500).json({ message: otpResponse.message });
    }

    res.status(200).json({ message: "OTP sent successfully. Please verify to continue." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// for registering a user
export const SIGNUP = async (req, res) => {
  try {
    const { name,token, email, password, state, city, localGovernment } = req.body;

    // 🔹 Validate required fields
    if (!name ||!token|| !email || !password || !state || !city || !localGovernment) {
      return res.status(400).json({ message: "All fields are required" });

    }
// ✅ Strong password validation
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
if (!passwordRegex.test(password)) {
  return res.status(400).json({
    message: "Password must be at least 8 characters long and include one uppercase letter, one number, and one special character (@$!%*?&).",
  });
}

 // 🔹 Check token  validity
 const otpRecord = await EmailVerification.findOne({ email, token });
 if (!otpRecord) {
   return res.status(400).json({ message: "get a verificaion token from your email" });
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

    // 🔹 Delete OTP record after successful verification
    await EmailVerification.deleteOne({ email });

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


// for requesting otp for password reset 
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
  const { email, otp, newPassword } = req.body;
  
  try {
    console.log("🔄 RESET PASSWORD STARTED");

    // 🔍 Validate required fields
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Strong password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include one uppercase letter and one number.",
      });
    }
    // 🔍 Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User Not Found");
      return res.status(404).json({ message: "User not found" });
    }

    // 🔍 Find OTP record
    const otpRecord = await passwordRest.findOne({ email, otp });
    if (!otpRecord) {
      console.log("❌ Invalid OTP");
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ⏳ Check if OTP expired
    const otpExpiryTime = otpRecord.createdAt.getTime() + parseInt(process.env.OTP_EXPIRY || 500000);
    if (Date.now() > otpExpiryTime) {
      console.log("❌ OTP Expired");
      return res.status(400).json({ message: "OTP expired" });
    }

    

    // 🚀 Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    console.log("🔑 Generated Hashed Password:", hashedPassword);

    // 🔄 Store New Password & Maintain Last 3 Passwords
    user.previousPasswords = [...(user.previousPasswords || []).slice(-2), user.password]; // Keep only last 2 + current
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();

    console.log("✅ User Found:", user.email);
    console.log("📝 Entered Password Before Hashing:", newPassword);

    // 🔄 Update user password
    await User.updateOne({ email }, { $set: { password: hashedPassword, previousPasswords: user.previousPasswords, passwordChangedAt: user.passwordChangedAt } });

    // 🗑️ Delete OTP record
    await passwordRest.deleteOne({ email });
    console.log("✅ OTP Record Deleted");

    // 📧 Send Notification Email
    try {
      await SendEmail(
        user.email,
        "Password Changed Successfully",
        "Your password has been changed successfully. If you did not request this, please contact support immediately."
      );
    } catch (emailError) {
      console.warn("⚠️ Password reset successful, but email notification failed.");
    }

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



