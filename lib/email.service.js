import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
import EmailVerification from '../models/emailVerification.model.js';



// generate otp a 6 digit number for password reset
 export const GenerateOTP = () => {

  return crypto.randomInt(100000, 999999).toString()
}
// Create a transporter object
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail', // Use your email service (e.g., Gmail, Outlook)
        auth: {
            user: process.env.EMAIL_USER, // Your email
            pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
        },
    });
};

// Example usage:
const transporter = createTransporter();

// for sending otp to user email
export const SendOtpEmail = async (email, otp) => {
  try {
    console.log('Sending OTP to:', email); // Debug: Log the recipient email
    console.log('Using Email User:', process.env.EMAIL_USER);
    createTransporter();
    // Define email options
    const mailOptions = {
      from: `"E-SHOP SERVICES " <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}`,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send OTP email');
  }
};


// for sending email verification before signup
export const VerifyEmailWithOtp = async (email) => {

  try {
    console.log("🔵 API Called: VerifyEmailWithOtp");
    console.log("📥 Received email:", email);

    if (!email) {
      return { success: false, message: "Email is required" };
    }

      // Generate a 6-digit OTP
      const token = crypto.randomInt(100000, 999999);
      const otpExpiry = Date.now() + 10 * 60 * 1000; // Expires in 5 minutes

      // Save OTP in the database
      await EmailVerification.findOneAndUpdate(
          { email },
          { email, token, expiresAt: otpExpiry },
          { upsert: true, new: true }
      );

      // Send OTP via email
      await transporter.sendMail({
        from: `"E-SHOP SERVICES " <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Email Verification OTP',
          text: `Your OTP for email verification is: ${token}. It will expire in 5 minutes.`,
      });

      console.log("✅ OTP sent successfully to", email);
      return { success: true, message: "OTP sent successfully" };
  } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ message: 'Failed to send OTP' });
  }
}
//for sending password reset success email
export const SendEmail = async (to, subject, text) => {
    const mailOptions = {
      from: `"E-SHOP SERVICES " <${process.env.EMAIL_USER}>`,
      to,
      subject: "Password Reset Success",
      text: `Your password has been changed successfully. If you did not request this, please contact support immediately.`,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}`);
    } catch (error) {
      console.error("❌ Error sending OTP:", error);
      return { success: false, message: "Failed to send OTP", error: error.message }; // ✅ Return failure response
    }
  };