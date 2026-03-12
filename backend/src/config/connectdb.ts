import mongoose from "mongoose";

// Prevent deprecation warnings
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('MongoDB connected successfully to:', mongoURI.substring(0, 20) + '...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't use process.exit in serverless - it kills the function
    throw error;
  }
};

export default connectDB;