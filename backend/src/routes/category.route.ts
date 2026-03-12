import { Router } from 'express';
import { createCategory , updateCategory ,getCategories ,getCategoryById ,deleteCategory ,updateCategorystatus} from "../conttrolers/category.conttrolers"
const categoryrouter = Router();
import { verifyToken } from "../middleware/auth";
import {checkPermission, Permission} from "../middleware/rbac";
import {isAdmin} from "../middleware/rbac";

// All category routes require authentication
    // categoryrouter.use(verifyToken);

categoryrouter.post("/categories", verifyToken, isAdmin, createCategory);
categoryrouter.get("/categories", verifyToken, getCategories);
categoryrouter.get("/categories/:id", verifyToken, getCategoryById);
categoryrouter.put("/categories/:id", verifyToken, isAdmin, updateCategory);
categoryrouter.delete("/categories/:id", verifyToken, isAdmin, deleteCategory);
categoryrouter.patch("/categories/:id", verifyToken, isAdmin, updateCategorystatus);

export default categoryrouter;