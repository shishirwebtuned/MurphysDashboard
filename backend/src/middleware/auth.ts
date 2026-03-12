import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Auth from '../models/auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid?: string;
    userId?: string; 
    email?: string;
  };
}

export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Check for Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Unauthorized: Invalid token format' });
      return;
    }

    // 2. Verify the server-issued JWT
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET || "defaultsecret") as any;
      
      // Extract ID from common payload keys
      const id = decodedToken?.userId || decodedToken?.uid || decodedToken?.sub;

      if (!id || !mongoose.isValidObjectId(String(id))) {
        res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
        return;
      }

      // 3. Find the user in the database
      const user = await Auth.findById(String(id)).select('-password');
      
      if (!user) {
        res.status(401).json({ error: 'Unauthorized: User no longer exists' });
        return;
      }

      // 4. Attach user to request and proceed
      req.user = { 
        uid: user._id.toString(), 
        userId: user._id.toString(), 
        email: user.email 
      };
      
      return next();

    } catch (jwtErr: any) {
      res.status(401).json({ 
        error: 'Unauthorized: Invalid or expired token', 
        details: jwtErr.message 
      });
      return;
    }
  } catch (error: any) {
    console.error('Middleware Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};