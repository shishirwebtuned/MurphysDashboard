import mongoose from 'mongoose';


const ChartSchema = new mongoose.Schema({
    // userid can be either a Mongo ObjectId (Profile._id) or an external auth UID (string)
    userid: { type: mongoose.Schema.Types.Mixed, required: true },
    Services: [{ 
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
        status: { type: String, enum: ['pending', 'confirmed' ,'done'], default: 'pending' },
        confirmedAt: { type: Date }
    }],
}, { timestamps: true });

const Cart = mongoose.model('Cart', ChartSchema);

export default Cart;