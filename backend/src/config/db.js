import mongoose from "mongoose";

export const connectDb = async () => {
    try {
        console.log("Attempting to connect to MongoDB..."); // Visual anchor to know it's running
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Stop hanging after 5 seconds
            family: 4                       // Force IPv4 network routing
        }); 
        
        console.log("MongoDB connected successfully"); 
    }
    catch(error) {
        console.error("MongoDB connection failed : ", error.message); 
        process.exit(1); 
    }
};
