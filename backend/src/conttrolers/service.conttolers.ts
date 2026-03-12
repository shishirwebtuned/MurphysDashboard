import Service from "../models/service.model";
import Category from "../models/category.model";
import { Request, Response } from "express";
import cloudinary from '../config/cloudinary';
import AssignService from '../models/assignService.routes';
import cron from 'node-cron';


// Create a new service. Expects optional image upload middleware to set
// req.body.profile_image and req.body.public_id when a file is uploaded.
export const createService = async (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    const {
      name,
      description,
      price,
      currency,
      billingType,
      categoryId,
      categoryName,
      hasDiscount,
      discountType,
      discountValue,
      discountReason,
      discountStartDate,
      discountEndDate,
      tags,
      features,
      isFeatured,
      durationInDays,
      notes,
    } = payload;

    // Validate required fields
    if (!name || !description || !price || !currency || !billingType || !categoryId || !durationInDays) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const imageUrl = payload.profile_image || payload.image || '';
    const publicId = payload.public_id || payload.publicid || '';

    const newService = new Service({
      name,
      description,
      price,
      currency,
      billingType,
      categoryId,
      categoryName: categoryName || category.name,
      hasDiscount,
      discountType,
      discountValue,
      discountReason,
      discountStartDate,
      discountEndDate,
      tags,
      features,
      isFeatured,
      durationInDays,
      notes,
      image: imageUrl,
      publicid: publicId,
    });

    await newService.save();

    return res.status(201).json({ success: true, message: 'Service created successfully', data: newService });
  } catch (error: any) {
    console.error('Error creating service:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A service with this name already exists' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Invalid data provided', error: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to create service', error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
  }
};

// Get paginated list of services with optional filters
export const getServices = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', category, search } = req.query as any;
    const pageNum = Math.max(1, parseInt(page as string || '1'));
    const lim = Math.max(1, parseInt(limit as string || '20'));

    const filter: any = {};
    if (category) filter.categoryId = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const total = await Service.countDocuments(filter);
    const services = await Service.find(filter).skip((pageNum - 1) * lim).limit(lim).sort({ createdAt: -1 });

    return res.json({ success: true, data: services, pagination: { total, page: pageNum, limit: lim } });
  } catch (error: any) {
    console.error('Error fetching services:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
};

// Get single service by id
export const getServiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    return res.json({ success: true, data: service });
  } catch (error: any) {
    console.error('Error getting service:', error);
    return res.status(500).json({ success: false, message: 'Failed to get service' });
  }
};

// Update a service. If a new image was uploaded, delete the old one from Cloudinary
export const updateService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const service = await Service.findById(id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    // If a new image was uploaded via middleware, payload.profile_image and payload.public_id will exist
    if (payload.public_id && service.publicid) {
      try {
        await cloudinary.uploader.destroy(service.publicid);
      } catch (err) {
        console.warn('Failed to delete previous cloudinary image:', err);
      }
    }

    // Merge and save
    Object.keys(payload).forEach((key) => {
      // Only set known fields to avoid overwriting unexpectedly
      (service as any)[key] = payload[key];
    });

    await service.save();
    return res.json({ success: true, message: 'Service updated', data: service });
  } catch (error: any) {
    console.error('Error updating service:', error);
    return res.status(500).json({ success: false, message: 'Failed to update service' });
  }
};

// Delete a service and its image from Cloudinary (if present)
export const deleteService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    // Check for assigned services
    const assignedService = await AssignService.findOne({ service_catalog_id: id });
    if (assignedService) {
      return res.status(400).json({ success: false, message: 'Cannot delete service with assigned clients' });
    }
    if (service.publicid) {
      try {
        await cloudinary.uploader.destroy(service.publicid);
      } catch (err) {
        console.warn('Failed to delete cloudinary image for service:', err);
      }
    }

    await Service.deleteOne({ _id: id });
    return res.json({ success: true, message: 'Service deleted' });
  } catch (error: any) {
    console.error('Error deleting service:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
};



const cronSchedule = '31 13 * * *'; // every day at 13:31
console.log(`Scheduling remove expired discounts cron job with schedule: "${cronSchedule}"`);
if (cron.validate(cronSchedule)) {
  cron.schedule(cronSchedule, async () => {
    try {
      console.log('Remove the discount when the end date is reached cron job started');
      // Find all services
      const allServices = await Service.find({hasDiscount: true, discountEndDate: { $lte: new Date() }});
      console.log(`Found ${allServices.length} services with expired discounts to update`);
      for (const service of allServices) {
        service.hasDiscount = false;
        service.discountType = undefined;
        service.discountValue = undefined;
        service.discountReason = undefined;
        service.discountStartDate = undefined;
        service.discountEndDate = undefined;
        await service.save();
        console.log(`Updated service ${service._id} - ${service.name} to remove expired discount`);
      }
    } catch (error) {
      console.error('Error in remove expired discounts cron job:', error);
    }
  });
} else {
  console.error(`Invalid cron expression for service discount cleanup: "${cronSchedule}". Cron job will not be started.`);
}