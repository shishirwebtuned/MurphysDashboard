import Cart from '../models/cart.model';
import { Request, Response } from 'express';
import Profile from '../models/profile.model';

// Add service to cart
export const addToCart = async (req: Request, res: Response) => {
    try {
        let { userid, serviceId } = req.body;

        // sanitize string IDs that may include extra quotes from client
        const normalizeId = (v: any) => {
            if (typeof v === 'string') return v.replace(/^"+|"+$/g, '');
            return v;
        };

        userid = normalizeId(userid);
        serviceId = normalizeId(serviceId);
        let cart = await Cart.findOne({ userid });
        if (!cart) {
            cart = new Cart({ userid, Services: [{ serviceId, status: 'pending' }] });
            await cart.save();
            return res.status(200).json({ cart, message: 'Service added to cart successfully' });
        } else {
            // Check if service already exists
            const existingService = cart.Services.find((s: any) => s.serviceId.toString() === serviceId);
            if (existingService) {
                return res.status(400).json({ message: 'This service is already in your cart' });
            }
            cart.Services.push({ serviceId, status: 'pending' });
        }
        await cart.save();
        res.status(200).json({ cart, message: 'Service added to cart successfully' });
    }
    catch (error) {
        // Handle common cast errors for invalid ObjectId
        if ((error as any).name === 'CastError') {
            return res.status(400).json({ message: 'Invalid id format', error: (error as any).message });
        }
        res.status(500).json({ message: 'Server Error', error });
    }
};
// Get cart by user ID
export const getCartByUserId = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) ||20;
    const skip = (page - 1) * limit;
    try {
        let { userid } = req.params;
        userid = typeof userid === 'string' ? userid.replace(/^"+|"+$/g, '') : userid;
        const [total, cart] = await Promise.all([
            Cart.countDocuments({ userid }),
            Cart.findOne({ userid }).populate('Services.serviceId')
        ]);
       
        res.status(200).json({
            cart,
            pagination: {
                totalPages: 1,
                currentPage: 1,
                total: total,
                limit: limit
            },
        });
    }
    catch (error) {
        if ((error as any).name === 'CastError') {
            return res.status(400).json({ message: 'Invalid id format', error: (error as any).message });
        }
        res.status(500).json({ message: 'Server Error', error });
    }
};
// Remove service from cart
export const removeFromCart = async (req: Request, res: Response) => {
    try {
        let { userid, serviceId } = req.body;
        userid = typeof userid === 'string' ? userid.replace(/^"+|"+$/g, '') : userid;
        serviceId = typeof serviceId === 'string' ? serviceId.replace(/^"+|"+$/g, '') : serviceId;
        const cart = await Cart.findOne({ userid });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        cart.Services = cart.Services.filter(
            (service: any) => service.serviceId.toString() !== serviceId
        ) as any;
        await cart.save();
        // Populate the services before returning
        await cart.populate('Services.serviceId');
        res.status(200).json(cart);
    }
    catch (error) {
        if ((error as any).name === 'CastError') {
            return res.status(400).json({ message: 'Invalid id format', error: (error as any).message });
        }
        res.status(500).json({ message: 'Server Error', error });
    }
};
// Clear cart
export const clearCart = async (req: Request, res: Response) => {
    try {
        let { userid } = req.body;
        userid = typeof userid === 'string' ? userid.replace(/^"+|"+$/g, '') : userid;
        const cart = await Cart.findOne({ userid });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        cart.Services = [] as any;
        await cart.save();
        res.status(200).json(cart);
    }
    catch (error) {
        if ((error as any).name === 'CastError') {
            return res.status(400).json({ message: 'Invalid id format', error: (error as any).message });
        }
        res.status(500).json({ message: 'Server Error', error });
    }
};
// Delete entire cart
export const deleteCart = async (req: Request, res: Response) => {
    try {
        let { userid } = req.body;
        userid = typeof userid === 'string' ? userid.replace(/^"]+|"]+$/g, '') : userid;
        const cart = await Cart.findOneAndDelete({ userid });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        res.status(200).json({ message: 'Cart deleted successfully', cart });
    }
    catch (error) {
        if ((error as any).name === 'CastError') {
            return res.status(400).json({ message: 'Invalid id format', error: (error as any).message });
        }
        res.status(500).json({ message: 'Server Error', error });
    }
};
// Get all carts (for admin purposes)
export const getAllCarts = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    try {
        // fetch carts and services, use lean() to get plain JS objects
        const [total, cartsRaw] = await Promise.all([
            Cart.countDocuments(),
            Cart.find({ "Services.status": { $ne: "pending" } })
                .skip(skip)
                .populate({ path: 'Services.serviceId', select: 'name image price' })
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean()
        ]);

        // Attach profile info to each cart when possible
        const carts = await Promise.all(cartsRaw.map(async (c: any) => {
            try {
                let profile = null;
                if (c.userid) {
                    if (typeof c.userid === 'string' && /^[0-9a-fA-F]{24}$/.test(c.userid)) {
                        profile = await Profile.findById(c.userid).select('userId firstName lastName email').lean();
                    }
                    if (!profile && typeof c.userid === 'string' && c.userid.includes('@')) {
                        profile = await Profile.findOne({ email: c.userid }).select('_id firstName lastName email').lean();
                    }
                    if (!profile) {
                        profile = await Profile.findOne({ userId: c.userid }).select('_id firstName lastName email').lean();
                    }
                }

                const user = profile
                    ? { user_id: profile.userId || profile._id, firstName: profile.firstName || '', lastName: profile.lastName || '', email: profile.email || '' }
                    : { user_id: c.userid, firstName: '', lastName: '', email: '' };

                return { ...c, user };
            } catch (e) {
                return { ...c, user: { user_id: c.userid, firstName: '', lastName: '', email: '' } };
            }
        }));

        res.status(200).json({
           carts,
            pagination: {
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total: total,
                limit: limit
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
// Update cart service status
    export const updateCartStatus = async (req: Request, res: Response) => {
    try {
        let { serviceItemId, status } = req.body;
        console.log('UpdateCartStatus called with:', { serviceItemId, status });
        serviceItemId = typeof serviceItemId === 'string' ? serviceItemId.replace(/^"+|"+$/g, '') : serviceItemId;
        
        // Find cart that contains the service item with this _id
        const cart = await Cart.findOne({ 'Services._id': serviceItemId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart or service item not found' });
        }
        
        // Find the specific service item by its _id
        const service = cart.Services.find((s: any) => s._id.toString() === serviceItemId);
        
        if (!service) {
            return res.status(404).json({ message: 'Service not found in cart' });
        }
        
        service.status = status;
        if (status === 'confirmed') {
            service.confirmedAt = new Date();
        }
        
        await cart.save();
        
        // Populate and return updated cart
        const updatedCart = await Cart.findOne({ _id: cart._id }).populate('Services.serviceId');
        res.status(200).json(updatedCart);
    }
    catch (error) {
        if ((error as any).name === 'CastError') {
            return res.status(400).json({ message: 'Invalid id format', error: (error as any).message });
        }
        res.status(500).json({ message: 'Server Error', error });
    }
};
    
