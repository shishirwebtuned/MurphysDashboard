import mongoose, { Schema, Document } from 'mongoose';

export interface IBillingHistory extends Document {
  user_email: string;
  user_id: string;
  assign_service_id: string;
  renewal_id: string;
  invoice_id: string;
  service_name: string;
  amount: number;
  currency: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  paypal_order_id?: string;
  paypal_payer_id?: string;
  payment_date?: Date;
  failure_reason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const BillingHistorySchema = new Schema<IBillingHistory>(
  {
    user_email: {
      type: String,
      required: true,
      index: true,
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    assign_service_id: {
      type: String,
      required: true,
      ref: 'AssignService',
    },
    renewal_id: {
      type: String,
      required: true,
    },
    invoice_id: {
      type: String,
      required: true,
    },
    service_name: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'aud',
    },
    payment_status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    payment_method: {
      type: String,
      default: 'paypal',
    },
    paypal_order_id: {
      type: String,
      sparse: true,
    },
    paypal_payer_id: {
      type: String,
    },
    payment_date: {
      type: Date,
    },
    failure_reason: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
BillingHistorySchema.index({ user_email: 1, payment_status: 1 });
BillingHistorySchema.index({ createdAt: -1 });

const BillingHistory = mongoose.model<IBillingHistory>('BillingHistory', BillingHistorySchema);

export default BillingHistory;
