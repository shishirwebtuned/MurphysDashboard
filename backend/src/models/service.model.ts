import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
          name: { type: String, required: true, unique: true, trim: true },
          description: { type: String, required: true, trim: true },
          price: { type: Number, required: true },
          currency:{ type: String, required: true },
          billingType: { type: String, enum: ['one_time', 'monthly', 'yearly', 'pay_as_you_go'], required: true },
          categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
          categoryName: { type: String, required: true },
          hasDiscount: { type: Boolean, required: false, default: false },
          discountType: { type: String, enum: ['percentage', 'fixed'], required: false, default: 'percentage' },
          discountValue: { type: Number, required: false, default: 0 },
          discountReason: { type: String, required: false, default: '' },
          discountStartDate: { type: Date, required: false },
          discountEndDate: { type: Date, required: false },
          tags: { type: [String], required: false },
          features: { type: [String], required: false },
          isFeatured: { type: Boolean, required: false },
          durationInDays: { type: Number, required: true },
          notes: { type: String, required: false },
          image : { type: String, required: false },
          publicid: { type: String, required: false },
          status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });


const Service = mongoose.model("Service", serviceSchema);
export default Service;
