import { Router } from "express";
import { 
  registerUser, 
  getCurrentUser,
  verifyEmail,
  resendVerificationEmail,
  refreshToken,
  login,
  verifyForgotPasswordToken,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteUser

} from "../conttrolers/auth.controllers";
import { 
  sendVerificationEmail, 
  verifyTokenSS
} from "../conttrolers/emailVerification.controllers";

import { verifyToken } from "../middleware/auth";

const authRouter = Router();


// Public routes
authRouter.post("/auth/verify-email", verifyEmail);
authRouter.post("/auth/send-verification", sendVerificationEmail); // Step 1: Send email
authRouter.post("/auth/verify-token", verifyTokenSS); // Step 2: Verify token

// Protected routes (require Firebase authentication)
authRouter.post("/auth/register",  registerUser);
authRouter.get("/auth/me", verifyToken, getCurrentUser);
authRouter.post("/auth/resend-verification", verifyToken, resendVerificationEmail);
authRouter.post("/auth/refresh-token", refreshToken);
authRouter.post("/auth/login", login);
authRouter.post("/auth/verify-forgot-password-token", verifyForgotPasswordToken);
authRouter.post("/auth/forgot-password", forgotPassword);
authRouter.post("/auth/reset-password", resetPassword);
authRouter.post("/auth/change-password", verifyToken, changePassword);
authRouter.delete("/auth/delete-user", verifyToken, deleteUser);


export default authRouter;
