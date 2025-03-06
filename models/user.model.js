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
            /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
            "Please enter a valid email address"
        ],
        validate: {
            validator: async function (value) {
                // Optional: Check for disposable email providers
                const disposableDomains = ["tempmail.com", "mailinator.com", "10minutemail.com"];
                const domain = value.split("@")[1];
                return !disposableDomains.includes(domain);
            },
            message: "Disposable email addresses are not allowed",
        }
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters long"],
    maxlength: [128, "Password cannot exceed 128 characters"],
    validate: {
        validator: function (value) {
            return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
        },
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    },
    select: false // Prevents password from being returned in queries
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

 const User = mongoose.model("User", userSchema);

    // Hash the password before saving the user model
    userSchema.pre("save", async function (next) {
        // Hash the password before saving the user model
        if (!this.isModified("password")) return next();
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            return next();
        } catch (error) {
            return next(error);
        }
    });

    userSchema.methods.comparePassword = async function (password) {
        return bcrypt.compare(password, this.password);}

    export default User;


 