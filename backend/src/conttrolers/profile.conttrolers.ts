import Profile from "../models/profile.model";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import transporter from "../config/nodemiller";
import Auth  from "../models/auth"



export const createProfile = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;

  try {
    const body = req.body as any;
    const email = body?.email;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const ifemailesist = await Profile.findOne({ email: email });
    if (ifemailesist) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const uploadimageUrl = body.profile_image || body.imageUrl;


    // Build profile data, prefer image data attached by cloudinaryUpload middleware
    const profileData: any = {
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      email,
      phone: body.phone,
      bio: body.bio,
      city: body.city,
      country: body.country,
      dob: body.dob,
      doj: body.doj,
      gender: body.gender,
      position: body.position,
      state: body.state,
      website: body.website,
      profile_image: body.profile_image || body.imageUrl || undefined,
      public_id: body.public_id || undefined,
      userId: user?.uid,
      referralSource: body.referralSource
    };

    const profile = new Profile(profileData);
    await profile.save();
    res.status(201).json({ data: profile, message: "Profile created successfully" });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getProfiles = async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search as string | undefined;
  const inviteStatus = req.query.inviteStatus as string | undefined;
  const email = req.query.email as string | undefined;


  try {
    if (email) {
      const profile = await Profile.findOne({ email: email });
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      return res.status(200).json({ data: profile });
    } else {
      const filter: any = {};
      if (search) {
        const regex = new RegExp(search, 'i');
        filter.$or = [
          { firstName: { $regex: regex } },
          { lastName: { $regex: regex } },
          { email: { $regex: regex } },
        ];
      }
      if (inviteStatus) {
        filter.inviteStatus = inviteStatus;
      }
      const [total, profiles] = await Promise.all([
        Profile.countDocuments(filter),
        Profile.find(filter).skip(skip).limit(limit)
      ]);
      return res.status(200).json({
        data: profiles,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};


export const getProfileById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};


export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body as any;

    const user= req.user;

   
  
    // Build update data object
    const updateData: any = {
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      email: body.email,
      phone: body.phone,
      bio: body.bio,
      city: body.city,
      country: body.country,
      dob: body.dob,
      doj: body.doj,
      gender: body.gender,
      position: body.position,
      state: body.state,
      website: body.website,
      role: body.role,
      status: body.status,
      usertypes: body.usertypes,
      userId: user?.uid,
      referralSource: body.referralSource
    };

    // Only update image fields if a new image was uploaded
    if (body.profile_image) {
      updateData.profile_image = body.profile_image;
    }
    if (body.public_id) {
      updateData.public_id = body.public_id;
    }

    const profile = await Profile.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(200).json({ data: profile, message: "Profile updated successfully" });
  }
  catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};


export const sentemail = async (req: Request, res: Response) => {
  const { to, subject, body } = req.body;

  try {
    // Create styled HTML email template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <!-- Main Container -->
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                      ${subject}
                    </h1>
                  </td>
                </tr>
                
                <!-- Body Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <div style="color: #333333; font-size: 16px; line-height: 1.8; white-space: pre-wrap;">
                      ${body}
                    </div>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td style="padding: 0 30px;">
                    <div style="border-top: 1px solid #e5e7eb;"></div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; text-align: center; background-color: #f9fafb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                      This email was sent from your Murphys Client account.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} Your Company. All rights reserved.
                    </p>
                  </td>
                </tr>
                
              </table>
              
              <!-- Bottom Spacing -->
              <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                <tr>
                  <td style="text-align: center; padding: 20px;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      If you have any questions, please don't hesitate to contact us.
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      text: body, // Plain text fallback
      html: htmlTemplate // Beautiful HTML version
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getProfileByEmail = async (req: Request, res: Response) => {
  try {
    const email = req.params.email;
    const profile = await Profile.findOne({ email: email });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({ data: profile, message: "Profile retrieved successfully"});
  }
  catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};




export const getAdminProfiles = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const role_type = req.query.role_type as string | undefined;
  const search = req.query.search as string | undefined;
  console.log("role_type:", role_type);
  console.log("search:", search);

  try {
    const filter: any = {};
    if (role_type) {
      filter.role_type = role_type;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
        { email: { $regex: regex } },
        { phone: { $regex: regex } },
        { city: { $regex: regex } },
        { country: { $regex: regex } }

      ];
    }

    const [total, admins] = await Promise.all([
      Profile.countDocuments(filter),
      Profile.find(filter).skip(skip).limit(limit)
    ]);

    res.status(200).json({
      data: admins,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      message: "Admin profiles retrieved successfully"
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Toggle user permissions (Admin only)
export const toggleUserPermission = async (req: Request, res: Response) => {
  try {
    const { userId, permission } = req.body;

    if (!userId || !permission) {
      return res.status(400).json({
        message: 'User ID and permission are required'
      });
    }

    const profile = await Profile.findById(userId);
    if (!profile) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize permissions array if it doesn't exist
    if (!profile.permissions) {
      profile.permissions = [];
    }

    // Toggle permission
    const permissionIndex = profile.permissions.indexOf(permission);
    if (permissionIndex > -1) {
      // Remove permission
      profile.permissions.splice(permissionIndex, 1);
    } else {
      // Add permission
      profile.permissions.push(permission);
    }

    await profile.save();

    // Re-fetch the profile to ensure we return the latest persisted document
    const updatedProfile = await Profile.findById(userId).select('-__v');
    console.log(`Permission toggle: user=${userId} permission=${permission} action=${permissionIndex > -1 ? 'removed' : 'added'}`);

    res.status(200).json({
      data: updatedProfile,
      message: `Permission ${permissionIndex > -1 ? 'removed' : 'added'} successfully`,
      permissions: updatedProfile?.permissions || []
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Update user role (Admin only)
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId, role_type } = req.body;

    if (!userId || !role_type) {
      return res.status(400).json({
        message: 'User ID and role type are required'
      });
    }
    // Validate role_type
    const validRoles = ['admin user', 'client user'];
    if (!validRoles.includes(role_type)) {
      return res.status(400).json({
        message: 'Invalid role type. Must be "admin user" or "client user"'
      });
    }

    const profile = await Profile.findById(userId);
    if (!profile) {
      return res.status(404).json({ message: 'User not found' });
    }
    profile.role_type = role_type;
    await profile.save();

    res.status(200).json({
      data: profile,
      message: 'User role updated successfully'
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Update user status (Admin only)
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { userId, status } = req.body;

    if (!userId || !status) {
      return res.status(400).json({
        message: 'User ID and status are required'
      });
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be "active", "inactive", or "suspended"'
      });
    }

    const profile = await Profile.findById(userId);
    if (!profile) {
      return res.status(404).json({ message: 'User not found' });
    }

    profile.status = status;
    await profile.save();

    res.status(200).json({
      data: profile,
      message: 'User status updated successfully'
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// Get user permissions
export const getUserPermissions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const profile = await Profile.findById(userId);
    if (!profile) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get role-based permissions
    const rolePermissions = profile.role_type === 'admin user'
      ? [
        'create_profile', 'read_profile', 'update_profile', 'delete_profile',
        'manage_users', 'manage_roles', 'manage_permissions',
        'create_service', 'update_service', 'delete_service', 'assign_service',
        'view_payments', 'manage_payments',
        'send_invitation', 'manage_invitations',
        'create_role', 'update_role', 'delete_role',
        'create_category', 'update_category', 'delete_category'

      ]
      : ['read_profile', 'update_profile', 'view_payments'];
    // Merge with custom permissions
    const allPermissions = [...new Set([...rolePermissions, ...(profile.permissions || [])])];
    res.status(200).json({
      data: {
        userId: profile._id,
        email: profile.email,
        role_type: profile.role_type,
        status: profile.status,
        rolePermissions,
        customPermissions: profile.permissions || [],
        allPermissions
      },
      message: 'User permissions retrieved successfully'
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};



export const deleteProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const profile = await Profile.findByIdAndDelete(id);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Also delete the associated auth document
    if (profile.email) {
      await Auth.findOneAndDelete({ email: profile.email });
    }

    res.status(200).json({
      data: profile,
      message: 'Profile and associated authentication data deleted successfully'
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
