import app from '../src/index';
import connectDB from '../src/config/connectdb';
import mongoose from 'mongoose';

export default async function handler(req: any, res: any) {
  // Ensure database is connected
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  } catch (err) {
    console.error('Database connection failed:', err);
    return res.status(500).json({
      error: 'Database connection error',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  // Handle the request using the Express app
  return app(req, res);
}
