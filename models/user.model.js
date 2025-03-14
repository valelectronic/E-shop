import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
    minlength: [3, "Name must be at least 3 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"],
    match: [/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"]

    },

    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim:true,
       match: [
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  "Please enter a valid email address"
],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters long"],
    },

    state: {
        type: String,
        required: [true, "State is required"],
      },
  
      city: {
        type: String,
        required: [true, "City is required"],
      },
  
      localGovernment: {
        type: String,
        required: [true, "Local Government is required"],
      },
   
    
    cartItems: [
        {
            quantity: {
                type: Number,
               default: 1,

            },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            }
        }
    ],

    
    role: {
        type: String,
        enum: ["customer", "admin"],
        default: "customer",

    },
    
}, {
    timestamps: true
});



    // Hash the password before saving the user model
    userSchema.pre("save", async function (next) {
        if (!this.isModified("password")) return next();
    
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            next();
        } catch (error) {
            next(error);
        }
    });
    
    userSchema.methods.comparePassword = async function (candidatePassword) {
        const trimmedPassword = candidatePassword.trim(); // Trim the candidate password
        return await bcrypt.compare(trimmedPassword, this.password);
        
    };
    const User = mongoose.model("User", userSchema);

    export default User;
    
