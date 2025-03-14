import mongoose from "mongoose";

const EmailVerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
    },
    token: {
        type: String,
        required: [true, "Token is required"],
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '10m' } // Auto-delete after 5 minutes
    }
}, {
    timestamps: true
});
 const EmailVerification = mongoose.model("EmailVerification", EmailVerificationSchema);

 export default EmailVerification;