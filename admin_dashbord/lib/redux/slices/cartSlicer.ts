import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axios';
import { Service } from '@/types/service';
import axios from '@/lib/axios';

export interface CartItem {
  _id: string;
  userid: string;
  Services: Array<{
    serviceId: Service;
    status: 'pending' | 'confirmed' | 'done';
    confirmedAt?: string;
    _id: string;
  }>;
  total: number;
  createdAt: string;
  updatedAt: string;
}

interface CartState {
  cart: CartItem | null;
  carts: CartItem[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalCarts: number;
}

const initialState: CartState = {
  cart: null,
  carts: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  totalCarts: 0,
};

// Compute cart total from services, applying discounts if present
const computeCartTotal = (cart: CartItem | null): number => {
  if (!cart || !Array.isArray(cart.Services)) return 0;
  let sum = 0;
  for (const item of cart.Services) {
    const svc: any = item.serviceId;
    if (!svc || typeof svc.price !== 'number') continue;
    let price = Number(svc.price) || 0;
    if (svc.hasDiscount && svc.discountValue) {
      if (svc.discountType === 'percentage') {
        price = price - (price * (svc.discountValue || 0) / 100);
      } else {
        price = price - (svc.discountValue || 0);
      }
    }
    // ensure non-negative
    if (price < 0) price = 0;
    sum += price;
  }
  return sum;
};


// Get cart by user ID
export const getCart = createAsyncThunk(
  'cart/getCart',
  async (userid: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/cart/${userid}`);
      const total = response.data.total || 0;
      return response.data.cart;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Cart doesn't exist yet
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

export const updateCartStatus = createAsyncThunk(
  'cart/updateCartStatus',
  async ({ serviceItemId, status }: { serviceItemId: string; status: string }, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.patch('/cart/update-status', { serviceItemId, status });
        return response.data;
    }
    catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update cart status');
    }
    }
);

// Remove service from cart
export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async ({ userid, serviceId }: { userid: string; serviceId: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/cart/remove', { userid, serviceId });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove service from cart');
    }
  }
);

// Delete entire cart
export const deleteCart = createAsyncThunk(
  'cart/deleteCart',
  async (userid: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete('/cart/delete', { data: { userid } });
      return { userid, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete cart');
    }
  }
);

export const getAllCarts = createAsyncThunk(
  'cart/getAllCarts',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10 } = params;
      const response = await axiosInstance.get('/cart/all', { params: { page, limit } });
      return {
        carts: response.data.carts || [],
        pagination: response.data.pagination || {}
      };
    }
    catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch carts');
    }
  }
);

export const assignServiceToClient = createAsyncThunk(
  'cart/assignServiceToClient',
  async (payload: { client_id: string; service_catalog_id: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/assign-service', payload);
      return response.data;
    }
    catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign service');
    }
  }
);



const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCart: (state) => {
      state.cart = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Add to cart
  

    // Get cart
    builder.addCase(getCart.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getCart.fulfilled, (state, action) => {
      state.loading = false;
      state.cart = action.payload;
      state.total = computeCartTotal(state.cart);
    });
    builder.addCase(getCart.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    // Update cart status
    builder.addCase(updateCartStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
    }
    );
    builder.addCase(updateCartStatus.fulfilled, (state, action) => {
        state.loading = false;
      state.cart = action.payload;
      state.total = computeCartTotal(state.cart);
    });
    builder.addCase(updateCartStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
    });
    
    // Get all carts
    builder.addCase(getAllCarts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getAllCarts.fulfilled, (state, action) => {
      state.loading = false;
      state.carts = action.payload.carts;
      state.page = action.payload.pagination.currentPage || 1;
      state.limit = action.payload.pagination.limit || 10;
      state.totalPages = action.payload.pagination.totalPages || 0;
      state.totalCarts = action.payload.pagination.total || 0;
    });
    builder.addCase(getAllCarts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Assign service to client
    builder.addCase(assignServiceToClient.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(assignServiceToClient.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(assignServiceToClient.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Remove from cart
    builder.addCase(removeFromCart.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(removeFromCart.fulfilled, (state, action) => {
      state.loading = false;
      state.cart = action.payload;
      state.total = computeCartTotal(state.cart);
    });
    builder.addCase(removeFromCart.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete cart
    builder.addCase(deleteCart.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteCart.fulfilled, (state, action) => {
      state.loading = false;
      // Remove the deleted cart from the carts array
      state.carts = state.carts.filter(cart => cart.userid !== action.payload.userid);
      state.totalCarts = Math.max(0, state.totalCarts - 1);
    });
    builder.addCase(deleteCart.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;
