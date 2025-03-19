import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
import fs from "fs"
import path from 'path';
import handlebars from "handlebars"
import passwordRest from '../models/otp.models.js';

import EmailVerification from '../models/emailVerification.model.js';
import User from '../models/user.model.js';



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

// load email templates for password reset 
const resetPasswordPath = path.resolve("Templates","password.reset.template.html")
const resetPasswordSource = fs.readFileSync(resetPasswordPath, "utf-8")
const resetPasswordTemplate = handlebars.compile(resetPasswordSource)

export const SendOtpEmail = async (email, otp) => {
  try {
    console.log('Sending OTP to:', email); // Debug: Log the recipient email
    console.log('Using Email User:', process.env.EMAIL_USER);
    createTransporter();

     // Fetch OTP from DB to verify it's stored
         const verificationRecord = await passwordRest.findOne({ email });
         console.log("📌 Stored OTP:", verificationRecord.otp);
    
         // ✅ Inject OTP into the email template
         const htmlContent = resetPasswordTemplate({ token: verificationRecord.otp });

    // Define email options
    const mailOptions = {
      from: `"E-SHOP SERVICES " <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP',
     html:htmlContent
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send OTP email');
  }
};

// load email templates 
const emailTemplatePath = path.resolve("Templates","email.template.html")
const emaiTemplateSource = fs.readFileSync(emailTemplatePath, "utf-8")
const template = handlebars.compile(emaiTemplateSource)

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
           // Fetch OTP from DB to verify it's stored
           const verificationRecord = await EmailVerification.findOne({ email });
           console.log("📌 Stored OTP:", verificationRecord.token);
    
           // ✅ Inject OTP into the email template
           const htmlContent = template({ otp: verificationRecord.token });
      // Send OTP via email
      await transporter.sendMail({
        from: `"E-SHOP SERVICES " <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Email Verification OTP',
          html: htmlContent
      });

      console.log("✅ OTP sent successfully to", email);
      return { success: true, message: "OTP sent successfully" };
  } catch (error) {
      console.error('Error sending OTP:', error);
      res.status(500).json({ message: 'Failed to send OTP' });
  }
}
//for sending password reset success email
// email template
const resetSuccessPath = path.resolve("Templates","reset.success.html")
const resetSuccessSource = fs.readFileSync(resetSuccessPath, "utf-8")
const SuccessTemplate = handlebars.compile(resetSuccessSource)

export const SendEmail = async (to, subject,) => {

  const getDetails = await User.findOne({ email:to });
  console.log("📌 Stored name:", getDetails.name);

  const htmlContent = SuccessTemplate({details:getDetails.name})
    const mailOptions = {
      from: `"E-SHOP SERVICES " <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html:htmlContent
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}`);
    } catch (error) {
      console.error("❌ Error sending OTP:", error);
      return { success: false, message: "Failed to send OTP", error: error.message }; // ✅ Return failure response
    }
  };