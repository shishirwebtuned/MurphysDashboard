import Invite from "../models/invite.model";
import { Request, Response } from "express";
import transporter from "../config/nodemiller";
import Profile from "../models/profile.model";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../middleware/auth";
dotenv.config()




export const sendInvite = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, invite_email ,role_type } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check existing invites and profiles
    const [inviteemailexist , profileemailexist ]= await Promise.all([
      Invite.findOne({ email: email, inviteStatus: "pending", role_type }),
      Profile.findOne({ email: email })
    ]);
    if (profileemailexist) {
      return res.status(409).json({ message: "Email is already registered" });
    }
    if (inviteemailexist) {
      return res
        .status(409)
        .json({ message: "An invite has already been sent to this email" });
    }
    // Save invite

    const invite = new Invite({
      email,
      firstName,
      lastName,
      invite_type: "invite",
      invite_email,
      inviteStatus: "pending",
      role_type,
    });

    await invite.save();

    // Generate token
    const token = jwt.sign(
      { email,
        firstName,
        lastName
       },
      process.env.JWT_SECRET as string,
      { expiresIn: "5d" }
    );
 const encodedUrlToken = encodeURIComponent(token);
    const acceptUrl = `${process.env.frontendurl}createaccount/token=${encodedUrlToken}`;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "You're invited to join Murphys Client",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Hello ${firstName || ""} ${lastName || ""},</h2>

          <p>
            You’ve been invited to join <strong>Murphys Client</strong>.
          </p>

          <p>
            Please accept your invitation by clicking the button below.
            This invitation will expire in <strong>5 days</strong>.
          </p>

          <div style="margin: 30px 0;">
            <a href="${acceptUrl}"
              style="
                background-color: #2563eb;
                color: #ffffff;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                display: inline-block;
              ">
              Accept Invitation
            </a>
          </div>

          <p style="font-size: 14px; color: #666;">
            If you didn’t expect this invitation, you can safely ignore this email.
          </p>

          <p>
            Best regards,<br />
            <strong>Murphys Client Team</strong>
          </p>
        </div>
      `,
    });

    return res.status(201).json({
      data: invite,
      message: "Invitation sent successfully",
    });
  } catch (error) {
    return res.status(400).json({
      message: (error as Error).message,
    });
  }
};


export const verifyInviteToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { email: string };
    const invite = await Invite.findOne({ email: decoded.email, invite_type: 'invite' });
    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }
      if(invite.inviteStatus !== 'pending') {
      return res.status(400).json({ message: `Invite has already been ${invite.inviteStatus}` });
    }

    res.status(200).json({ data: invite, message: "Invite token is valid" });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};


export const getInvites = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const email = req.query.email as string | undefined;

  try {
    if (email) {
      const invite = await Invite.findOne({ email: email, invite_type: 'invite' });
      if (!invite) {
        return res.status(404).json({ message: "Invite not found" });
      }
      if(invite.inviteStatus == 'pending' || invite.inviteStatus == 'rejected' ) {
        return res.status(400).json({ message: `Invite has already been ${invite.inviteStatus}` });
      }
      return res.status(200).json({ data: invite, message: "Invite retrieved successfully" });
    }

    const [total , invites] = await Promise.all([
      Invite.countDocuments({ invite_type: 'invite' }),
      Invite.find({ invite_type: 'invite' }).skip(skip).limit(limit)
    ]);

    res.status(200).json({ data: invites, 
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
       message: "Invites retrieved successfully" });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const changeInviteStatus = async (req: Request, res: Response) => {
  try {
    const { email, status } = req.body; 
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const invite = await Invite.findOne({ email: email, invite_type: 'invite' });
    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }
     invite.inviteStatus = status;
    await invite.save();
    res.status(200).json({ data: invite, message: "Invite status changed successfully" });
  }
  catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};



  export const updateInvite = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const invite = await Invite.findByIdAndUpdate(id, updateData, { new: true });
      if (!invite) {
        return res.status(404).json({ message: "Invite not found" });
      }
      res.status(200).json({ data: invite, message: "Invite updated successfully" });
    }
    catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  };

export const deleteInvite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invite = await Invite.findByIdAndDelete(id);
    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }
    res.status(200).json({ data: invite, message: "Invite deleted successfully" });
  }
  catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export  const inviteAgain = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const invite = await Invite.findById(id);
    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }
    const email = invite.email;
    const firstName = invite.firstName;
    const lastName = invite.lastName;
    const role_type = invite.role_type;
    const token = jwt.sign(
      { email,
        firstName,
        lastName,
       },
      process.env.JWT_SECRET as string,
      { expiresIn: '5d' }
    );
 const encodedUrlToken = encodeURIComponent(token);
   invite.inviteStatus = 'pending';
   invite.role_type = role_type;
   await invite.save();
    const acceptUrl = `${process.env.frontendurl}createaccount/token=${encodedUrlToken}`;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "You're invited to join Murphys Client",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Hello ${firstName || ""} ${lastName || ""},</h2>

          <p>
            You’ve been invited to join <strong>Murphys Client</strong>.
          </p>

          <p>
            Please accept your invitation by clicking the button below.
            This invitation will expire in <strong>5 days</strong>.
          </p>

          <div style="margin: 30px 0;">
            <a href="${acceptUrl}"
              style="
                background-color: #2563eb;
                color: #ffffff;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                display: inline-block;
              ">
              Accept Invitation
            </a>
          </div>

          <p style="font-size: 14px; color: #666;">
            If you didn’t expect this invitation, you can safely ignore this email.
          </p>

          <p>
            Best regards,<br />
            <strong>Murphys Client Team</strong>
          </p>
        </div>
      `,
    });
  }
  catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};


//users
export const getinvitebyemail = async ( req: AuthenticatedRequest, res: Response) => {
  const email = req.user?.email;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    console.log(email)
  try {
    if (!email) {
      return res.status(400).json({ message: 'No email associated with authenticated user' });
    }
    // Run find and count in parallel for pagination
    const [invites, total] = await Promise.all([
      Invite.find({ invite_email: email, invite_type: 'invite' }).skip(skip).limit(limit),
      Invite.countDocuments({ invite_email: email, invite_type: 'invite' }),
    ]);

    if (!invites || invites.length === 0) {
      return res.status(404).json({ message: "Invite not found" });
    }

    // Return paginated invites
    res.status(200).json({
      data: invites,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      message: "Invite retrieved successfully",
    });
  }
  catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
