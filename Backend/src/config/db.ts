import mongoose from "mongoose"
import { MONGO_URI } from "../constants/env";


const connectToDatabase = async () => {
  try{
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log("Connected to the database.");
  }catch(err){
    console.log("Could not connect to the database.",err);
    process.exit(1);
  }

}

export default connectToDatabase;