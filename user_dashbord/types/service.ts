export interface Category {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
  _id: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingType: 'one_time' | 'monthly' | 'yearly' | 'pay_as_you_go';
  categoryId: string;
  categoryName: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
  hasDiscount?: boolean;
  discountPercentage?: number;
  discountedPrice?: number;
  discountReason?: string;
  discountStartDate?: string;
  discountEndDate?: string;
  discountValue?: number;
  isFeatured?: boolean;
  durationInDays?: number;
  notes?: string;
  discountType?: 'percentage' | 'fixed';
  tags?: string[];
  features?: string[];


}

export interface ServiceFormData {
  name: string;
  description: string;
  price: number;
  currency: string;
  billingType: 'one_time' | 'monthly' | 'yearly' | 'pay_as_you_go';
  categoryId: string;
  categoryName: string;
  status: 'active' | 'inactive';
  // optional form fields
  hasDiscount?: boolean;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountReason?: string;
  discountStartDate?: string;
  discountEndDate?: string;
  tags?: string[];
  features?: string[];
  isFeatured?: boolean;
  durationInDays?: number;
  notes?: string;
  

}

// Service assignment / subscription model
// This represents assigning a catalog service to a client (subscription)
export interface ServiceAssignment {
  // unique id for the assignment (uuid)
  id: string;

  // reference to client/profile
  client_id: string;

  // reference to the service catalog item
  service_catalog_id: string;

  // assignment status
  status: 'active' | 'paused' | 'cancelled';

  // ISO date strings
  start_date: string;
  renewal_date?: string | null;

  // billing cycle
  cycle: 'monthly' | 'annual' | 'none';

  // optional overrides
  price?: number;
  auto_invoice?: boolean;
  notes?: string;

  // backend-managed timestamps (optional on client-side)
  created_at?: string;
  updated_at?: string;
}
