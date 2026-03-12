import { Router } from "express";
import { sendAdminOtp, verifyAdminOtp } from "../conttrolers/otp.controller";

const otpRouter = Router();

otpRouter.post("/admin-otp/send", sendAdminOtp);
otpRouter.post("/admin-otp/verify", verifyAdminOtp);

export default otpRouter;
