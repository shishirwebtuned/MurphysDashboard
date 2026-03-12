import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  userId: string;
  userEmail: string;
  userName: string;
  assignedServiceId: string;
  assignedServiceName: string;
  problemType: string;
  description: string;
  images: string[];
  publicIds: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  adminResponse?: string;
  adminId?: string;
  adminEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    assignedServiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    assignedServiceName: { type: String, required: true },
    problemType: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    publicIds: [{ type: String }],
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: { 
      type: String, 
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
      index: true
    },
    adminResponse: { type: String },
    adminId: { type: String },
    adminEmail: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ITicket>('Ticket', TicketSchema);
