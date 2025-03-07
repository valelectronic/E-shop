import mongoose from "mongoose";

export const setupDB = async ()=>{
    try {
        const connect = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Database connected: ${connect.connection.host}`);
    } catch (error) {
        console.log(`Error connecting to mongoDB: ${error.message}`);
        process.exit(1 );
      
        
    }
}