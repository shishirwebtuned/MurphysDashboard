import AssignService from "../models/assignService.routes";
import BillingHistory from "../models/billingHistory.model";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";

/** Get a short-lived OAuth2 access token from PayPal */
async function getPayPalAccessToken(): Promise<string> {
    // Read at request-time so dotenv values are always picked up
    const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
    const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

    console.log('🔑 PayPal Config Check:');
    console.log('Client ID:', clientId ? `${clientId.substring(0, 10)}...` : 'MISSING');
    console.log('Client Secret:', clientSecret ? `${clientSecret.substring(0, 10)}...` : 'MISSING');
    console.log('Base URL:', baseUrl);

    if (!clientId || !clientSecret) {
        throw new Error('PayPal credentials (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) are not set in environment variables');
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    console.log('🔐 Requesting PayPal access token...');
    
    const resp = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });
    
    if (!resp.ok) {
        const err = await resp.text();
        console.error('❌ PayPal auth failed:', err);
        throw new Error(`PayPal auth failed: ${err}`);
    }
    
    const data = await resp.json() as any;
    console.log('✅ PayPal access token obtained successfully');
    return data.access_token as string;
}

export const getBillingInfo = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        const status = req.query.status as string | undefined;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const billingInfo = await AssignService.find({ email: user?.email });
        res.status(200).json({ data: billingInfo, message: 'Billing info retrieved successfully' });

        if (!billingInfo) {
            return res.status(404).json({ message: 'Billing info not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }

};

/** Step 1 – Create a PayPal order and return the orderID to the frontend */
export const createPayPalOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const { renewalId, amount, assignServiceId } = req.body;

        if (!renewalId || !amount || !assignServiceId) {
            return res.status(400).json({ message: 'Missing required fields: renewalId, amount, assignServiceId' });
        }

        const assignService = await AssignService.findById(assignServiceId);
        if (!assignService) return res.status(404).json({ message: 'Service not found' });

        const accessToken = await getPayPalAccessToken();

        const frontendUrl = process.env.frontendurl || 'http://localhost:3001/';
        const baseUrl = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;

        const orderPayload = {
            intent: 'CAPTURE',
            purchase_units: [
                {
                    reference_id: `${assignServiceId}-${renewalId}`,
                    description: `Renewal for ${assignService.service_name} (${assignService.invoice_id})`,
                    amount: {
                        currency_code: 'AUD',
                        value: Number(amount).toFixed(2),
                    },
                    custom_id: `${user.uid || ''}::${renewalId}::${assignServiceId}`,
                },
            ],
            application_context: {
                return_url: `${baseUrl}/admin/billing`,
                cancel_url: `${baseUrl}/admin/billing`,
                brand_name: 'Murphy\'s Technology',
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW',
                shipping_preference: 'NO_SHIPPING',
            },
        };

        console.log('🔵 Creating PayPal order with payload:', JSON.stringify(orderPayload, null, 2));

        const orderResp = await fetch(`${process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderPayload),
        });

        if (!orderResp.ok) {
            const errText = await orderResp.text();
            console.error('PayPal create order error:', errText);
            return res.status(502).json({ message: 'PayPal order creation failed', detail: errText });
        }

        const order = await orderResp.json() as any;

        console.log('✅ PayPal order created successfully');
        console.log('Order ID:', order.id);
        console.log('Order Status:', order.status);
        console.log('Approval URL:', order.links?.find((l: any) => l.rel === 'approve')?.href);

        // Create a pending billing history so we can tie it to the capture later
        const billingHistory = new BillingHistory({
            user_email: user.email || '',
            user_id: user.uid || '',
            assign_service_id: assignServiceId,
            renewal_id: renewalId,
            invoice_id: assignService.invoice_id,
            service_name: assignService.service_name,
            amount,
            currency: 'aud',
            payment_status: 'pending',
            payment_method: 'paypal',
            paypal_order_id: order.id,
            metadata: {
                renewal_label: assignService.renewal_dates.find((r: any) => r._id.toString() === renewalId)?.label,
            },
        });
        await billingHistory.save();

        console.log('✅ PayPal order created:', order.id);
        return res.status(201).json({ orderID: order.id, billingHistoryId: billingHistory._id });

    } catch (error: any) {
        console.error('❌ createPayPalOrder error:', error);
        return res.status(500).json({ message: 'Server error during order creation', error: error.message });
    }
};

/** Step 2 – Capture an approved PayPal order and update billing history */
export const capturePayPalPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const { orderID, renewalId, assignServiceId } = req.body;

        if (!orderID || !renewalId || !assignServiceId) {
            return res.status(400).json({ message: 'Missing required fields: orderID, renewalId, assignServiceId' });
        }

        const accessToken = await getPayPalAccessToken();

        const captureResp = await fetch(`${process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders/${orderID}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        const captureData = await captureResp.json() as any;

        console.log('📦 PayPal capture response:', JSON.stringify(captureData, null, 2));

        if (!captureResp.ok || captureData.status !== 'COMPLETED') {
            console.error('❌ PayPal capture failed:', captureData);
            // Mark pending billing record as failed
            await BillingHistory.findOneAndUpdate(
                { paypal_order_id: orderID },
                { payment_status: 'failed', failure_reason: JSON.stringify(captureData) }
            );
            return res.status(400).json({ message: 'PayPal capture failed', detail: captureData });
        }

        const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
        const payerId = captureData.payer?.payer_id || '';

        // Update billing history
        const billingHistory = await BillingHistory.findOneAndUpdate(
            { paypal_order_id: orderID },
            {
                payment_status: 'completed',
                paypal_payer_id: payerId,
                payment_date: new Date(),
            },
            { new: true }
        );

        // Mark renewal as paid in assign service
        const assignService = await AssignService.findById(assignServiceId);
        if (assignService) {
            const renewalDate = assignService.renewal_dates.find(
                (r: any) => r._id.toString() === renewalId
            );
            if (renewalDate) {
                renewalDate.haspaid = true;
                await assignService.save();
                console.log('✅ Renewal marked as paid');
            }
        }

        console.log('✅ PayPal payment captured:', capture?.id);
        return res.status(200).json({
            message: 'Payment captured successfully',
            billingHistoryId: billingHistory?._id,
            capture: {
                id: capture?.id,
                amount: capture?.amount,
                status: captureData.status,
            },
        });

    } catch (error: any) {
        console.error('❌ capturePayPalPayment error:', error);
        return res.status(500).json({ message: 'Server error during payment capture', error: error.message });
    }
};

export const getBillingHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const {
            status,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = req.query;

        // Build query
        const query: any = { user_email: user.email };

        // Filter by payment status
        if (status && status !== 'all') {
            query.payment_status = status;
        }

        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate as string);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate as string);
            }
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [billingHistory, total] = await Promise.all([
            BillingHistory.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            BillingHistory.countDocuments(query)
        ]);

        res.status(200).json({
            data: billingHistory,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            },
            message: 'Billing history retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching billing history:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};

export const getBillingStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const stats = await BillingHistory.aggregate([
            {
                $match: { user_email: user.email }
            },
            {
                $group: {
                    _id: '$payment_status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totalPaid = await BillingHistory.aggregate([
            {
                $match: {
                    user_email: user.email,
                    payment_status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        res.status(200).json({
            stats,
            totalPaid: totalPaid[0]?.total || 0,
            message: 'Billing stats retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching billing stats:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};


export const deleteBillingRecord = async (req: AuthenticatedRequest, res: Response) => {
    try {

        const { id } = req.params;
        console.log('Attempting to delete billing record with ID:', id);
        const billingRecord = await BillingHistory.findById(id);
        if (!billingRecord) {
            return res.status(404).json({ message: 'Billing record not found' });
        }
        await BillingHistory.findByIdAndDelete(id);
        res.status(200).json({ message: 'Billing record deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Admin endpoints - Get all billing history across all users
export const getAdminBillingHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const {
            status,
            clientEmail,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = req.query;

        // Build query for all users
        const query: any = {};

        // Filter by specific client if provided
        if (clientEmail && clientEmail !== 'all') {
            query.user_email = clientEmail;
        }

        // Filter by payment status
        if (status && status !== 'all') {
            query.payment_status = status;
        }

        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate as string);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(endDate as string);
            }
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [billingHistory, total] = await Promise.all([
            BillingHistory.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            BillingHistory.countDocuments(query)
        ]);

        res.status(200).json({
            data: billingHistory,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            },
            message: 'Admin billing history retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching admin billing history:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Admin endpoints - Get stats for all users
export const getAdminBillingStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Aggregate stats across all users
        const stats = await BillingHistory.aggregate([
            {
                $group: {
                    _id: '$payment_status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totalPaid = await BillingHistory.aggregate([
            {
                $match: {
                    payment_status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        res.status(200).json({
            stats,
            totalPaid: totalPaid[0]?.total || 0,
            message: 'Admin billing stats retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching admin billing stats:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};

// Admin endpoint - Delete billing record (admin version)
export const deleteAdminBillingRecord = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        console.log('Admin attempting to delete billing record with ID:', id);

        const billingRecord = await BillingHistory.findById(id);
        if (!billingRecord) {
            return res.status(404).json({ message: 'Billing record not found' });
        }

        await BillingHistory.findByIdAndDelete(id);
        res.status(200).json({
            message: 'Billing record deleted successfully',
            deletedRecord: {
                id: billingRecord._id,
                user_email: billingRecord.user_email,
                amount: billingRecord.amount,
                status: billingRecord.payment_status
            }
        });
    }
    catch (error) {
        console.error('Error deleting admin billing record:', error);
        res.status(500).json({ message: 'Server Error', error });
    }
};

/** Test endpoint to verify PayPal credentials */
export const testPayPalConnection = async (req: Request, res: Response) => {
    try {
        console.log('🧪 Testing PayPal connection...');
        const accessToken = await getPayPalAccessToken();
        
        // Test creating a minimal order
        const testOrderPayload = {
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'AUD',
                    value: '1.00'
                },
                description: 'Test order'
            }],
        };

        const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
        const orderResp = await fetch(`${baseUrl}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testOrderPayload),
        });

        const orderData = await orderResp.json() as any;

        if (!orderResp.ok) {
            console.error('❌ Test order failed:', orderData);
            return res.status(502).json({ 
                success: false,
                message: 'PayPal test order failed', 
                detail: orderData,
                suggestion: 'Your PayPal sandbox credentials may be invalid or the account may have restrictions.'
            });
        }

        console.log('✅ PayPal test successful!');
        return res.status(200).json({ 
            success: true,
            message: 'PayPal connection successful',
            testOrderId: orderData.id,
            accountStatus: 'Active and working'
        });

    } catch (error: any) {
        console.error('❌ PayPal test failed:', error);
        return res.status(500).json({ 
            success: false,
            message: 'PayPal connection test failed', 
            error: error.message 
        });
    }
};
