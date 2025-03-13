import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();


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
      console.error('❌ Error sending email:', error.message);
      throw new Error('Failed to send email'); // Throw error so we can handle it
    }
  };