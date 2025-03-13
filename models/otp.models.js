import mongoose from 'mongoose';
import dot from 'dotenv';
dot.config();



const otpSchema = new mongoose.Schema({
email : {
    type: String,
    required: [true, "Email is required"],

},
    otp: {
    type: String,
    required: [true, "OTP is required"],
},
    createdAt: {
    type: Date,
    default: Date.now,
    expires: process.env.OTP_EXPIRY ,
},

})

const passwordRest  = mongoose.model("OTP", otpSchema)
export default passwordRest

