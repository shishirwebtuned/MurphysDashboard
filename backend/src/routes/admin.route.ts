import { Router } from 'express';
import {  clearAllCollections } from '../conttrolers/admin.controllers';

const adminRouter = Router();

// Dangerous operation: clear all documents from a collection. Protected by auth + isAdmin.
// Use DELETE with collection name as a URL param and no body input.
// Dangerous: clear every collection. Per request this endpoint has no guard.
adminRouter.delete('/clear-all', clearAllCollections);

export default adminRouter;
