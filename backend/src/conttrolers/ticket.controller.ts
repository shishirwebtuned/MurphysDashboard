import Ticket from '../models/ticket.model';
import { Request, Response  } from 'express';
import cloudinary from '../config/cloudinary';
import { AuthenticatedRequest } from '../middleware/auth';
import Profile from '../models/profile.model';

// Create a new ticket
export const createTicket = async (req: AuthenticatedRequest, res: Response) => {
  const userid= req.user?.userId;
  console.log('userid:', userid )

  const user = await Profile.findOne({ userId: userid });


  try {
    const {
      userId: userid,
      userEmail: bodyUserEmail,
      userName: bodyUserName,
      assignedServiceId,
      assignedServiceName,
      problemType,
      description,
      priority,
      images = [],
      publicIds = []
    } = req.body;
    
    // Resolve user fields (prefer auth/profile values, fall back to body)
    const userId = user ? user.userId : userid;
    const userEmail =  user?.email || bodyUserEmail;
    const userName =  (user ? `${user.firstName} ${user.lastName}` : bodyUserName);

    // Validate required fields
    if (!userId || !userEmail || !userName || !assignedServiceId || !assignedServiceName || !problemType || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    console.log('Creating ticket with data:', {
      userId,
      userEmail,
      userName,
      assignedServiceId,
      assignedServiceName,
      problemType,
      description,
      images,
      publicIds,
      priority: priority || 'medium',
      status: 'open'
    });

    const newTicket = new Ticket({
      userId,
      userEmail,
      userName,
      assignedServiceId,
      assignedServiceName,
      problemType,
      description,
      images,
      publicIds,
      priority: priority || 'medium',
      status: 'open'
    });

    await newTicket.save();

    return res.status(201).json({ 
      success: true, 
      message: 'Ticket created successfully', 
      data: newTicket 
    });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to create ticket', 
      error: error.message 
    });
  }
};

// Get all tickets with pagination and filters
export const getTickets = async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      userId, 
      status, 
      priority,
      assignedServiceId
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const lim = Math.max(1, parseInt(limit as string));

    const filter: any = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedServiceId) filter.assignedServiceId = assignedServiceId;

    const total = await Ticket.countDocuments(filter);
    const tickets = await Ticket.find(filter)
      .skip((pageNum - 1) * lim)
      .limit(lim)
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: pageNum,
        limit: lim,
        totalPages: Math.ceil(total / lim)
      }
    });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tickets' 
    });
  }
};

// Get single ticket by id
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    return res.json({ success: true, data: ticket });
  } catch (error: any) {
    console.error('Error getting ticket:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get ticket' 
    });
  }
};

// Update ticket
export const updateTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    // Update allowed fields
    const allowedFields = [
      'problemType', 
      'description', 
      'priority', 
      'status', 
      'adminResponse',
      'adminId',
      'adminEmail',
      'images',
      'publicIds'
    ];

    allowedFields.forEach(field => {
      if (payload[field] !== undefined) {
        (ticket as any)[field] = payload[field];
      }
    });

    await ticket.save();

    return res.json({ 
      success: true, 
      message: 'Ticket updated successfully', 
      data: ticket 
    });
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update ticket' 
    });
  }
};

// Delete ticket
export const deleteTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    // Delete images from cloudinary if they exist
    if (ticket.publicIds && ticket.publicIds.length > 0) {
      try {
        await Promise.all(
          ticket.publicIds.map(publicId => 
            cloudinary.uploader.destroy(publicId)
          )
        );
      } catch (err) {
        console.warn('Failed to delete cloudinary images:', err);
      }
    }

    await Ticket.deleteOne({ _id: id });

    return res.json({ 
      success: true, 
      message: 'Ticket deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting ticket:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to delete ticket' 
    });
  }
};

// Update ticket status
export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value' 
      });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    ticket.status = status;
    await ticket.save();

    return res.json({ 
      success: true, 
      message: 'Ticket status updated', 
      data: ticket 
    });
  } catch (error: any) {
    console.error('Error updating ticket status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update ticket status' 
    });
  }
};



//user api

export const getUserTickets = async (req: AuthenticatedRequest, res: Response) => {
  const userid = req.user?.userId;
  try {
    const { 
      page = '1', 
      limit = '10', 
      status, 
      priority,
      assignedServiceId
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const lim = Math.max(1, parseInt(limit as string));

    const filter: any = {};
          if (userid) filter.userId = userid;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedServiceId) filter.assignedServiceId = assignedServiceId;

    const total = await Ticket.countDocuments(filter);
    const tickets = await Ticket.find(filter)
      .skip((pageNum - 1) * lim)
      .limit(lim)
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: pageNum,
        limit: lim,
        totalPages: Math.ceil(total / lim)
      }
    });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tickets' 
    });
  }
};
