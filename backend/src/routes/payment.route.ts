import { Router } from "express";
import { createPayment, getPayments, getPaymentById, updatePayment, deletePayment ,changePaymentStatus , } from "../conttrolers/payment.conttrolers";
// import { verifyToken } from "../middleware/auth";
import { checkPermission, Permission } from "../middleware/rbac";

const paymentrouter = Router();

// All payment routes require authentication
// paymentrouter.use(verifyToken);

paymentrouter.post("/payments",  createPayment);
paymentrouter.get("/payments", getPayments);
paymentrouter.get("/payments/:id", getPaymentById);
paymentrouter.put("/payments/:id", updatePayment);
paymentrouter.delete("/payments/:id", deletePayment);
paymentrouter.patch("/payments/:id/toggle", changePaymentStatus);

export default paymentrouter;
