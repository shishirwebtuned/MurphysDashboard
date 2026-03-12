import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors, { CorsOptions } from "cors";
import profilerouter from "./routes/profile.routes";
import inviterouter from "./routes/invite.route";
import paymentrouter from "./routes/payment.route";
import categoryrouter from "./routes/category.route";
import servicerouter from "./routes/service.route";
import assignClientRouter from "./routes/assignClient.routes";
import rolerouter from "./routes/role.routes";
import siteSettingRouter from "./routes/siteSetting.route";
import noticeRouter from "./routes/notic.routes";
import dashboardrouter from "./routes/dashboard";
import adminRouter from "./routes/admin.route";
import cartRouter from "./routes/cart.routes";
import billingrouter from "./routes/billing.routes";
import invoiceRouter from "./models/invoice.routes";
import privacyPolicyRouter from "./routes/privacypolicy.route";
import ticketRouter from "./routes/ticket.route";
import authRouter from "./routes/auth.routes";
import otpRouter from "./routes/otp.routes";

const app = express();

const allowedOrigins = [
  "https://client.murphystechnology.com.au",
  "https://login.murphystechnology.com.au",
  "http://localhost:3000",
  "http://localhost:3001",
];

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.send("API is running 🚀");
});

// Mount API routes
app.use("/api", authRouter);
app.use("/api", profilerouter);
app.use("/api", inviterouter);
app.use("/api", paymentrouter);
app.use("/api", categoryrouter);
app.use("/api", servicerouter);
app.use("/api", assignClientRouter);
app.use("/api", rolerouter);
app.use("/api/settings", siteSettingRouter);
app.use("/api", noticeRouter);
app.use("/api", dashboardrouter);
app.use("/api/admin", adminRouter);
app.use("/api/cart", cartRouter);
app.use("/api/billing", billingrouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api", privacyPolicyRouter);
app.use("/api", ticketRouter);
app.use("/api", otpRouter);

export default app;
