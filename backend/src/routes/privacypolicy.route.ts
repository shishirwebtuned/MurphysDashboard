import { createAndUpdatePrivacyPolicy, getPrivacyPolicy } from "../conttrolers/privacyPolicy.contollers";
import Router from "express";

const privacyPolicyRouter = Router();

privacyPolicyRouter.get("/privacy-policy", getPrivacyPolicy);
privacyPolicyRouter.post("/privacy-policy", createAndUpdatePrivacyPolicy);

export default privacyPolicyRouter;