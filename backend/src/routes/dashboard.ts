
import {getDashboardStats, getUserDashboardStats } from "../conttrolers/dashboard.controllers";
import { verifyToken} from "../middleware/auth";
import { Router } from "express";
const dashboardrouter = Router();
import { isAdmin } from "../middleware/rbac";

dashboardrouter.get('/stats', verifyToken, isAdmin, getDashboardStats)
dashboardrouter.get('/user-stats', verifyToken, getUserDashboardStats)

export default dashboardrouter;

    