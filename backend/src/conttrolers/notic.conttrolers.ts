import mongoose from "mongoose";
import Notice from "../models/notic.models";
import { Request, Response } from "express";

// Create a new notice
export const createNotice = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, title, message, email, phone, status } = req.body;
    const newNotice = new Notice({
      firstName,
      lastName,
      title,
      message,
      email,
      phone,
      status
    });
    const savedNotice = await newNotice.save();
    res.status(201).json(savedNotice);
  }
  catch (error) {
    res.status(500).json({ error: 'Failed to create notice', message: error instanceof Error ? error.message : 'Unknown error' });
  }
};
// Get all notices with pagination
export const getNotices = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const email = req.query.email as string | undefined;
    const skip = (page - 1) * limit;

  let filter = {};
  if (email) {
    filter = { email };
  }

    const [total, unread, notices] = await Promise.all([
      // use the same filter for total so when email is provided we count only that user's notices
      Notice.countDocuments(filter),
      Notice.countDocuments({ ...filter, status: false }),
      Notice.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    ]);


    res.status(200).json({
      data: notices,
      unreadCount: unread,

      pagination: {
        Page: page,
        totalPages: Math.ceil(total / limit),
        limit: limit,
        total: total
      },

    });
  }
  catch (error) {
    res.status(500).json({ error: 'Failed to fetch notices', message: error instanceof Error ? error.message : 'Unknown error' });
  }
};
// Delete a notice by ID
export const deleteNotice = async (req: Request, res: Response) => {
  try {
    const noticeId = req.params.id;
    const deletedNotice = await Notice.findByIdAndDelete(noticeId);
    if (!deletedNotice) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    res.status(200).json({ message: 'Notice deleted successfully' });
  }
  catch (error) {
    res.status(500).json({ error: 'Failed to delete notice', message: error instanceof Error ? error.message : 'Unknown error' });
  }
};


export const toggleNoticeStatus = async (req: Request, res: Response) => {
  try {
    const { noticeId, status } = req.body

    // Validate noticeId
    if (!mongoose.Types.ObjectId.isValid(noticeId)) {
      return res.status(400).json({ error: "Invalid notice ID" })
    }

    // Validate status
    if (typeof status !== "boolean") {
      return res.status(400).json({ error: "Status must be boolean" })
    }

    // Update notice FIRST
    const updatedNotice = await Notice.findByIdAndUpdate(
      noticeId,
      { status },
      { new: true }
    )

    if (!updatedNotice) {
      return res.status(404).json({ error: "Notice not found" })
    }

    // Count unread notices AFTER update
    const unreadCount = await Notice.countDocuments({ status: false })

    return res.status(200).json({
      data: updatedNotice,
      unreadCount,
      message: "Notice status updated successfully",
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failed to update notice status",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// Delete multiple notices by IDs
export const deleteManyNotices = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Invalid input", message: "ids must be a non-empty array" });
    }

    await Notice.deleteMany({
      _id: { $in: ids }
    });

    res.status(200).json({ message: 'Notices deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notices', message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Mark all notices as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    await Notice.updateMany({}, { status: true });

    // Count unread notices (should be 0)
    const unreadCount = await Notice.countDocuments({ status: false });

    res.status(200).json({
      message: 'All notices marked as read',
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notices as read', message: error instanceof Error ? error.message : 'Unknown error' });
  }
};



