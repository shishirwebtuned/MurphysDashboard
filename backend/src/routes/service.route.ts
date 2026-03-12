import express from 'express';
import upload from '../middleware/upload';
import cloudinaryUpload from '../middleware/cloudinaryUpload';
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
} from '../conttrolers/service.conttolers';
// import { verifyToken } from '../middleware/auth';
import { checkPermission, Permission } from '../middleware/rbac';
import { isAdmin } from '../middleware/rbac';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

// All service routes require authentication
// router.use(verifyToken);

// List services
router.get('/services', verifyToken, getServices);

// Get single service
router.get('/services/:id', verifyToken, getServiceById);

// Create service (supports multipart form with field 'image')
router.post('/services', verifyToken, isAdmin, upload.single('image'), cloudinaryUpload, createService);

// Update service (supports new image upload)
router.put('/services/:id', verifyToken, isAdmin, upload.single('image'), cloudinaryUpload, updateService);

// Delete service
router.delete('/services/:id', verifyToken, isAdmin, deleteService);
export default router;
