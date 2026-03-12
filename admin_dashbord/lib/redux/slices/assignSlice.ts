import axiosInstance from '@/lib/axios';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
interface AssignState {
  data: any[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
const initialState: AssignState = {
  data: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};


export const getAssignedServices = createAsyncThunk(
  'assign/getAssignedServices',
  async (
    params: { page?: number; limit?: number; search?: string; client_id?: string; service_catalog_id?: string; email?: string } = { page: 1, limit: 10 },
    { rejectWithValue }
  ) => {
    try {
      const { page = 1, limit = 10, search = '', client_id, service_catalog_id, email } = params;
      const query: any = { page, limit, search };
      if (client_id) query.client_id = client_id;
      if (service_catalog_id) query.service_catalog_id = service_catalog_id;
      if (email) query.email = email;
      const response = await axiosInstance.get(`/assigned_services`, {
        params: query,
      });
      // Expect response.data.data to be an array of assigned services
      const data = response.data.data || [];
      const pagination = response.data.pagination || {};
      return { data, pagination };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch assigned services');
    }
  }
);

// Fetch assign details by client_id and service_catalog_id
export const getAssignDetails = createAsyncThunk(
  'assign/getAssignDetails',
  async (
    payload: { client_id: string; service_catalog_id: string },
    { rejectWithValue }
  ) => {
    try {
      const { client_id, service_catalog_id } = payload;
      const response = await axiosInstance.get(`/assign_details/${client_id}/${service_catalog_id}`);
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch assign details');
    }
  }
);

export const deleteAssignedService = createAsyncThunk(
  'assign/deleteAssignedService',
  async (
    payload: { id: string | null },
    { rejectWithValue }
  ) => {
    try {
      const { id } = payload;
      if (!id) throw new Error('No id provided');
      const response = await axiosInstance.delete(`/assigned_services/${id}`);
      return response.data?.data || response.data;
    }
    catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete assigned service');
    }
  }
);

export const updateAssignedService = createAsyncThunk(
  'assign/updateAssignedService',
  async (
    payload: { id: string; data: any },
    { rejectWithValue }
  ) => {
    try {
      const { id, data } = payload;
      const response = await axiosInstance.put(`/assigned_services/${id}`, data);
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update assigned service');
    }
  }
);

export const addRenewalDate = createAsyncThunk(
  'assign/addRenewalDate',
  async (
    payload: { id: string; renewal_date: string; renewal_label: string; renewal_price: number; renewal_id?: string },
    { rejectWithValue }
  ) => {
    try {
      const { id, renewal_date, renewal_label, renewal_price, renewal_id } = payload;
      const body: any = {
        add_renewal_date: renewal_date,
        renewal_label: renewal_label,
        renewal_price: renewal_price,
      };
      // Only include renewal_id if it's provided (for updates)
      if (renewal_id) {
        body.renewal_id = renewal_id;
      }
      const response = await axiosInstance.put(`/assigned_services/${id}`, body);
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to add renewal date');
    }
  }
);


const assignSlice = createSlice({
  name: 'assign',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAssignedServices.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = [];
        state.total = 0;
        state.page = 1;
        state.limit = 10;

      }
      )
      .addCase(getAssignedServices.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // action.payload should be { data: [], pagination: { ... } }
        state.data = action.payload?.data || [];
        state.total = action.payload?.pagination?.totalCount || 0;
        state.page = action.payload?.pagination?.page || 1;
        state.limit = action.payload?.pagination?.limit || 10;
        state.totalPages = action.payload?.pagination?.totalPages || 0;
      }
      )
      .addCase(getAssignedServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      }
      )
      .addCase(getAssignDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAssignDetails.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // Here we can choose to store the details in a separate field if needed
      }
      )
      .addCase(getAssignDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      }
      )
      .addCase(deleteAssignedService.pending, (state) => {
        state.loading = true;
        state.error = null;
      }
      )
      .addCase(deleteAssignedService.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // Optionally remove the deleted item from state.data
        const deletedId = (action as any)?.meta?.arg?.id;
        if (deletedId) {
          state.data = state.data.filter(item => item._id !== deletedId);
          state.total = Math.max(0, (state.total || 1) - 1);
        }
      }
      )
      .addCase(deleteAssignedService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      }
      )
      .addCase(updateAssignedService.pending, (state) => {
        state.loading = true;
        state.error = null;
      }
      )
      .addCase(updateAssignedService.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // Update the item in state.data
        const index = state.data.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      }
      )
      .addCase(updateAssignedService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      }
      )
      .addCase(addRenewalDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      }
      )
      .addCase(addRenewalDate.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // Update the item in state.data
        const index = state.data.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      }
      )
      .addCase(addRenewalDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      }
      );


  },
});

export default assignSlice.reducer;
