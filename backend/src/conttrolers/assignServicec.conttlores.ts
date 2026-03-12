import Profile from "../models/profile.model";
import Service from "../models/service.model";
import AssignService from "../models/assignService.routes";
import { Request, Response } from "express";
import transporter from "../config/nodemiller";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from 'mongoose';
import NotificationService from "../services/notificationService";
import { AuthenticatedRequest } from "../middleware/auth";
dotenv.config()

interface JwtPayload {
  email: string;
  iat: number;
  exp: number;
}

export const assignServiceToClient = async (req: Request, res: Response) => {
  try {
    const { client_id, service_catalog_id, status, note, price, cycle, auto_invoice, start_date, end_date ,assign_by } = req.body;
    if (!client_id || !service_catalog_id || !price || !cycle) {
      return res.status(400).json({ message: 'client_id, service_catalog_id, price, and cycle are required' });
    }
    console.log(req.body);
    const useExistingService = await Service.findById(service_catalog_id);
    if (!useExistingService) {
      return res.status(404).json({ message: 'Service not found' });
    }
    const clientProfile = await Profile.findOne({ userId: client_id });
    if (!clientProfile) {
      return res.status(404).json({ message: 'Client profile not found' });
    }
    const email = clientProfile.email;
    const fullname = clientProfile.firstName + ' ' + clientProfile.lastName;

    const assignedService = new AssignService({
      invoice_id: `INV-${Date.now()}`, // Simple invoice ID generation
      client_id,
      service_catalog_id,
      status,
      note,
      price,
      cycle,
      isaccepted: "pending",
      auto_invoice,
      start_date,
      end_date,
      email,
      client_name: fullname,
      service_name: useExistingService.name,
      assign_by
    });
    const token = jwt.sign({ email: email }, process.env.JWT_SECRET as string, { expiresIn: '7d' }); // Token valid for 7 days

    await assignedService.save();
    const emailoptions = {
      from: `Murphys Client <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'New Service Assigned',
      html: `<p>Dear ${fullname},</p>
               <p>A new service has been assigned to you. this is start from the ${start_date} Please log in to your account to view the details.</p>
                <p>Service Details:</p>
                <ul>
                    <li>Service Name: ${useExistingService.name}</li>
                    <li>Description: ${useExistingService.description}</li>
                    <li>Price: ${price} ${useExistingService.currency}</li>
                    <li> End Date: ${end_date}</li>
                    <li>Billing Cycle: ${cycle}</li>
                </ul>
                <p> If you have any questions or need further assistance, please do not hesitate to contact our support team.</p>
                <p> Click Here to accept tis service: <a href="${process.env.frontendurl}/verify/encoadedurl:${token}">Murphys Client Portal</a></p>
                <p>Thank you for choosing Murphys Client!

               </p>
               <p>Best regards,<br/>Murphys Team</p>`
    };
    await transporter.sendMail(emailoptions);
    res.status(201).json({ data: assignedService, message: 'Service assigned to client successfully' });
  }
  catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const acceptedAssignedService = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { email: string };
    const decodedToken = jwt.decode(token) as { exp?: number } | null;
    if (decodedToken?.exp && Math.floor(Date.now() / 1000) > decodedToken.exp) {
      return res.status(401).json({ message: 'Token has expired' });
    }
    const assignedService = await AssignService.findOne({ email: decoded.email, isaccepted: 'pending' });


    if (!assignedService) {
      return res.status(404).json({ message: 'No pending assigned service found for this email' });
    }
    const userProfile = await Profile.findOne({ email: decoded.email });
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    res.status(200).json({ data: { assignedService, userProfile }, message: 'Assigned service accepted successfully' });
  }
  catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const acceptAssignedService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isaccepted } = req.body;
    const assignedService = await AssignService.findById(id);
    if (!assignedService) {
      return res.status(404).json({ message: 'Assigned service not found' });
    }
    assignedService.isaccepted = isaccepted;
    await assignedService.save();
    res.status(200).json({ data: assignedService, message: 'Assigned service accepted successfully' });
  }
  catch (error) {

    res.status(400).json({ message: (error as Error).message });
  }
};




export const getAllAssignedServices = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const searchQuery = (req.query.search as string) || '';
  const clientId = (req.query.client_id as string) || '';
  const serviceCatalogId = (req.query.service_catalog_id as string) || '';
  const email = (req.query.email as string) || '';

  try {
    const query: any = {};

    // 🔍 Search filter
    if (searchQuery) {
      query.$or = [
        { client_name: { $regex: searchQuery, $options: 'i' } },
        { service_name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    // 🎯 Email filter (separate & professional)
    if (email) {
      query.email = { $regex: email, $options: 'i' };
    }

    if (clientId) {
      query.client_id = new mongoose.Types.ObjectId(clientId);
    }

    if (serviceCatalogId) {
      query.service_catalog_id = new mongoose.Types.ObjectId(serviceCatalogId);
    }

    const totalCount = await AssignService.countDocuments(query);

    const pipeline: any[] = [
      { $match: query },
      { $sort: { createdAt: -1 } },

      {
        $lookup: {
          from: 'profiles',
          localField: 'client_id',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'services',
          localField: 'service_catalog_id',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          client_name: {
            $cond: [
              { $and: ['$client.firstName', '$client.lastName'] },
              { $concat: ['$client.firstName', ' ', '$client.lastName'] },
              '$client_name',
            ],
          },
          service_name: { $ifNull: ['$service.name', '$service_name' ] },
          service_description: { $ifNull: ['$service.description', '$service_description' ] },
          service_image : { $ifNull: ['$service.image', '$service_image' ]
        },
      },
    },

      { $project: { client: 0, service: 0 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const assignedServices = await AssignService.aggregate(pipeline as any);

    res.status(200).json({
      data: assignedServices,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      message: 'Assigned services retrieved successfully',
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};


export const getAssignDetails = async (req: Request, res: Response) => {
  try {
    const { client_id } = req.params as any;
    const { service_catalog_id } = req.params as any;

    if (!client_id || !service_catalog_id) {
      return res.status(400).json({ message: 'client_id and service_catalog_id are required' });
    }

    const [clientProfile, service] = await Promise.all([
      Profile.findOne({ userId: client_id }),
      Service.findById(service_catalog_id),
    ]);
    // if (!clientProfile || !service) {
    //   return res.status(404).json({ message: 'Client or Service not found' });
    // }
    res.status(200).json({ data: { clientProfile, service }, message: 'Assigned service retrieved successfully' });
  }
  catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const updateAssignedService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      isaccepted,
      price,
      end_date,
      add_renewal_date,
      renewal_date,
      renewal_label,
      renewal_price,
      renewal_id,
    } = req.body;

    const updateSet: any = {};
    if (isaccepted !== undefined) updateSet.isaccepted = isaccepted;
    if (price !== undefined) updateSet.price = price;
    // support updating end_date (allow null to clear it)
    if (end_date !== undefined) {
      updateSet.end_date = end_date ? new Date(end_date) : null;
    }

    const renewalDateStr = add_renewal_date || renewal_date;

    // 🔹 Renewal operation
    if (renewalDateStr && renewal_label && renewal_price !== undefined) {
      const currentService = await AssignService.findById(id);
      if (!currentService) {
        return res.status(404).json({ message: 'Assigned service not found' });
      }

      const existingRenewalTotal = (currentService.renewal_dates || []).reduce(
        (sum: number, r: any) => sum + (Number(r.price) || 0),
        0
      );

      const oldPrice =
        renewal_id
          ? (currentService.renewal_dates || []).find(
            (r: any) => String(r._id) === String(renewal_id)
          )?.price || 0
          : 0;

      const newTotal =
        existingRenewalTotal - Number(oldPrice) + Number(renewal_price);

      const servicePrice = Number(currentService.price || 0);

      if (newTotal > servicePrice) {
        return res.status(400).json({
          message: `Total renewal prices (${newTotal}) cannot exceed service price (${servicePrice})`,
        });
      }

      // 🔹 Update existing renewal
      if (renewal_id) {
        const updated = await AssignService.findOneAndUpdate(
          { _id: id, 'renewal_dates._id': renewal_id },
          {
            $set: {
              'renewal_dates.$.label': renewal_label,
              'renewal_dates.$.date': new Date(renewalDateStr),
              'renewal_dates.$.price': Number(renewal_price),
              ...updateSet,
            },
          },
          { new: true }
        );

        if (!updated) {
          return res.status(404).json({ message: 'Renewal entry not found' });
        }

        return res.status(200).json({
          data: updated,
          message: 'Renewal date updated successfully',
        });
      }

      // 🔹 Add new renewal
      const pushed = await AssignService.findByIdAndUpdate(
        id,
        {
          $push: {
            renewal_dates: {
              label: renewal_label,
              date: new Date(renewalDateStr),
              price: Number(renewal_price),
            },
          },
          ...(Object.keys(updateSet).length ? { $set: updateSet } : {}),
        },
        { new: true }
      );

      // Send notification for new renewal
      if (pushed) {
        const clientProfile = await Profile.findById(pushed.client_id);
        if (clientProfile) {
          await NotificationService.notifyNewRenewal({
            email: pushed.email,
            phone: clientProfile.phone || undefined,
            clientName: pushed.client_name,
            serviceName: pushed.service_name,
            renewalLabel: renewal_label,
            renewalDate: renewalDateStr,
            renewalPrice: Number(renewal_price)
          }).catch(err => console.error('Notification error:', err));
        }
      }

      return res.status(200).json({
        data: pushed,
        message: 'Renewal date added successfully',
      });
    }

    // 🔹 Simple update only
    const assignedService = await AssignService.findByIdAndUpdate(
      id,
      { $set: updateSet },
      { new: true }
    );

    if (!assignedService) {
      return res.status(404).json({ message: 'Assigned service not found' });
    }

    res.status(200).json({
      data: assignedService,
      message: 'Assigned service updated successfully',
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
export const deleteAssignedService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignedService = await AssignService.findByIdAndDelete(id);
    if (!assignedService) {
      return res.status(404).json({ message: 'Assigned service not found' });
    }
    res.status(200).json({ data: assignedService, message: 'Assigned service deleted successfully' });
  }
  catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

/**
 * Mark renewal as paid and send notification
 */
export const markRenewalAsPaid = async (req: Request, res: Response) => {
  try {
    const { id, renewal_id } = req.params;
    
    const assignedService = await AssignService.findById(id);
    if (!assignedService) {
      return res.status(404).json({ message: 'Assigned service not found' });
    }

    const renewal = assignedService.renewal_dates?.find((r: any) => String(r._id) === String(renewal_id));
    if (!renewal) {
      return res.status(404).json({ message: 'Renewal not found' });
    }

    // Update renewal to paid
    const updated = await AssignService.findOneAndUpdate(
      { _id: id, 'renewal_dates._id': renewal_id },
      { $set: { 'renewal_dates.$.haspaid': true } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Failed to update renewal' });
    }

    // Send payment confirmation notification
    const clientProfile = await Profile.findById(updated.client_id);
    if (clientProfile && renewal.label && renewal.date && renewal.price !== null && renewal.price !== undefined) {
      await NotificationService.notifyRenewalPaid({
        email: updated.email,
        phone: clientProfile.phone || undefined,
        clientName: updated.client_name,
        serviceName: updated.service_name,
        renewalLabel: renewal.label,
        renewalDate: renewal.date.toISOString(),
        renewalPrice: renewal.price
      }).catch(err => console.error('Notification error:', err));
    }

    res.status(200).json({
      data: updated,
      message: 'Renewal marked as paid and notifications sent'
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};






export const userAssignedServices = async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const userId = req.user?.userId || req.user?.uid || '';

  const searchQuery = (req.query.search as string) || '';
  const clientId = userId ;
  const serviceCatalogId = (req.query.service_catalog_id as string) || '';
  const email = req.user?.email || '';
  console.log(email)

  try {
    const query: any = {};

    // 🔍 Search filter
    if (searchQuery) {
      query.$or = [
        { client_name: { $regex: searchQuery, $options: 'i' } },
        { service_name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    // 🎯 Email filter (separate & professional)
    if (email) {
      query.email = { $regex: email, $options: 'i' };
    }

    if (clientId) {
      query.client_id = new mongoose.Types.ObjectId(clientId);
    }

    if (serviceCatalogId) {
      query.service_catalog_id = new mongoose.Types.ObjectId(serviceCatalogId);
    }

    const totalCount = await AssignService.countDocuments(query);

    const pipeline: any[] = [
      { $match: query },
      { $sort: { createdAt: -1 } },

      {
        $lookup: {
          from: 'profiles',
          localField: 'client_id',
          foreignField: '_id',
          as: 'client',
        },
      },
      { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'services',
          localField: 'service_catalog_id',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          client_name: {
            $cond: [
              { $and: ['$client.firstName', '$client.lastName'] },
              { $concat: ['$client.firstName', ' ', '$client.lastName'] },
              '$client_name',
            ],
          },
          service_name: { $ifNull: ['$service.name', '$service_name' ] },
          service_description: { $ifNull: ['$service.description', '$service_description' ] },
          service_image : { $ifNull: ['$service.image', '$service_image' ]
        },
      },
    },

      { $project: { client: 0, service: 0 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const assignedServices = await AssignService.aggregate(pipeline as any);

    res.status(200).json({
      data: assignedServices,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
      message: 'Assigned services retrieved successfully',
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

