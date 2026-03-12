import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Service, ServiceFormData } from '@/types/service';
import axiosInstance from '@/lib/axios';
import { ServiceAssignment } from '@/types/service';

interface ServiceState {
  services: Service[];
  loading: boolean;
  error: string | null;
  selectedService: Service | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const initialState: ServiceState = {
  services: [],
  loading: false,
  error: null,
  selectedService: null,
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

// Async thunk to fetch all services
export const fetchServices = createAsyncThunk(
  'services/fetchServices',
  async (
    params: { page?: number; limit?: number; category?: string; search?: string } = { page: 1, limit: 10 },
    { rejectWithValue }
  ) => {
    try {
      const { page = 1, limit = 10, category, search } = params;
      const response = await axiosInstance.get('/services', {
        params: { page, limit, category, search },
      });
      // backend returns { success: true, data: services, pagination: { total, page, limit } }
      const services: Service[] = response.data?.data || [];
      const pagination = response.data?.pagination || {};
      // helper to parse JSON strings that might be double-encoded like '["[\"a\",\"b\"]"]'
      const parseToArray = (val: any): string[] => {
        let v = val;
        let attempts = 0;
        while (typeof v === 'string' && attempts < 5) {
          try {
            v = JSON.parse(v);
          } catch (_err) {
            break;
          }
          attempts++;
        }
        // If after parsing we have a string wrapped in an array like ["a,b"] or ["[\"a\"]"]
        if (Array.isArray(v)) {
          // if elements are strings that look like JSON arrays, try to flatten
          if (v.length === 1 && typeof v[0] === 'string' && v[0].trim().startsWith('[')) {
            return parseToArray(v[0]);
          }
          return v.map((x: any) => (typeof x === 'string' ? x : String(x)));
        }
        // fallback: wrap scalar into array
        if (v == null) return [];
        return [String(v)];
      };

      // normalize ids coming from backend (_id -> id) and parse tags/features
      const normalized = services.map((s: any) => {
        const obj = { ...s, id: s.id || s._id } as any;
        obj.tags = parseToArray(obj.tags);
        obj.features = parseToArray(obj.features);
        return obj;
      });
      return { services: normalized, pagination };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch services');
    }
  }
);

// Async thunk to fetch a single service by ID
export const fetchServiceById = createAsyncThunk(
  'services/fetchServiceById',
  async (serviceId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/services/${serviceId}`);
      const service: any = response.data?.data || {};
      service.id = service.id || service._id;
      
      // Parse arrays using same logic as fetchServices
      const parseToArray = (val: any): string[] => {
        let v = val;
        let attempts = 0;
        while (typeof v === 'string' && attempts < 5) {
          try {
            v = JSON.parse(v);
          } catch (_err) {
            break;
          }
          attempts++;
        }
        if (Array.isArray(v)) {
          if (v.length === 1 && typeof v[0] === 'string' && v[0].trim().startsWith('[')) {
            return parseToArray(v[0]);
          }
          return v.map((x: any) => (typeof x === 'string' ? x : String(x)));
        }
        if (v == null) return [];
        return [String(v)];
      };
      
      service.tags = parseToArray(service.tags);
      service.features = parseToArray(service.features);
      
      return service;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch service');
    }
  }
);

// Async thunk to create a service
export const createService = createAsyncThunk(
  'services/createService',
  async (serviceData: FormData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/services', serviceData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const created: any = response.data?.data || {};
      created.id = created.id || created._id;
      // parse arrays robustly
      const parseToArrayLocal = (val: any) => {
        try {
          // reuse same logic as above
          let v = val;
          let attempts = 0;
          while (typeof v === 'string' && attempts < 5) {
            v = JSON.parse(v);
            attempts++;
          }
          if (Array.isArray(v)) {
            if (v.length === 1 && typeof v[0] === 'string' && v[0].trim().startsWith('[')) return JSON.parse(v[0]);
            return v.map((x: any) => (typeof x === 'string' ? x : String(x)));
          }
          if (v == null) return [];
          return [String(v)];
        } catch {
          return Array.isArray(val) ? val : [String(val)];
        }
      };
      created.tags = parseToArrayLocal(created.tags);
      created.features = parseToArrayLocal(created.features);
      return created as Service;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create service');
    }
  }
);

// Async thunk to update a service
export const updateService = createAsyncThunk(
  'services/updateService',
  async ({ _id, data }: { _id: string; data: FormData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/services/${_id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated: any = response.data?.data || {};
      updated.id = updated.id || updated._id;
      const parseToArrayLocal2 = (val: any) => {
        try {
          let v = val;
          let attempts = 0;
          while (typeof v === 'string' && attempts < 5) {
            v = JSON.parse(v);
            attempts++;
          }
          if (Array.isArray(v)) {
            if (v.length === 1 && typeof v[0] === 'string' && v[0].trim().startsWith('[')) return JSON.parse(v[0]);
            return v.map((x: any) => (typeof x === 'string' ? x : String(x)));
          }
          if (v == null) return [];
          return [String(v)];
        } catch {
          return Array.isArray(val) ? val : [String(val)];
        }
      };
      updated.tags = parseToArrayLocal2(updated.tags);
      updated.features = parseToArrayLocal2(updated.features);
      return updated as Service;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update service');
    }
  }
);

// Async thunk to delete a service
export const deleteService = createAsyncThunk(
  'services/deleteService',
  async (_id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/services/${_id}`);
      return _id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete service');
    }
  }
);

// Async thunk to toggle service status
export const toggleServiceStatus = createAsyncThunk(
  'services/toggleServiceStatus',
  async ({ _id, status }: { _id: string; status: 'active' | 'inactive' }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/services/${_id}`, { status });
      const updated: any = response.data?.data || {};
      const normalizedId = updated._id || updated.id || _id;
      return { _id: normalizedId, status: updated?.status || status };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to toggle service status');
    }
  }
);

// Async thunk to assign a service to a client (subscription/assignment)
export const assignServiceToClient = createAsyncThunk(
  'services/assignServiceToClient',
  async (
    payload: ServiceAssignment,
    { rejectWithValue }
  ) => {
    try {
      // Post JSON payload to backend - adjust endpoint as your backend expects
      const response = await axiosInstance.post('/assign-service', payload);
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to assign service');
    }
  }
);

const serviceSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    setSelectedService: (state, action: PayloadAction<Service | null>) => {
      state.selectedService = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch services
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.services = action.payload.services || [];
        const pagination = action.payload.pagination || {};
        state.page = pagination.page || state.page;
        state.limit = pagination.limit || state.limit;
        state.total = pagination.total || state.total;
        state.totalPages = Math.ceil((pagination.total || state.total) / (pagination.limit || state.limit));
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch service by ID
      .addCase(fetchServiceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceById.fulfilled, (state, action: PayloadAction<Service>) => {
        state.loading = false;
        state.selectedService = action.payload;
      })
      .addCase(fetchServiceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create service
      .addCase(createService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createService.fulfilled, (state, action: PayloadAction<Service>) => {
        state.loading = false;
        state.services.push(action.payload);
      })
      .addCase(createService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update service
      .addCase(updateService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateService.fulfilled, (state, action: PayloadAction<Service>) => {
        state.loading = false;
        const payloadId = (action.payload as any)._id || (action.payload as any).id;
        const index = state.services.findIndex(service => (service as any)._id === payloadId || (service as any).id === payloadId);
        if (index !== -1) {
          state.services[index] = action.payload;
        }
      })
      .addCase(updateService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete service
      .addCase(deleteService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteService.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.services = state.services.filter(service => (service as any)._id !== action.payload && (service as any).id !== action.payload);
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Toggle service status
      .addCase(toggleServiceStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleServiceStatus.fulfilled, (state, action: PayloadAction<{ _id: string; status: 'active' | 'inactive' }>) => {
        state.loading = false;
        const payloadId = action.payload._id;
        const index = state.services.findIndex(service => (service as any)._id === payloadId || (service as any).id === payloadId);
        if (index !== -1) {
          state.services[index].status = action.payload.status;
        }
      })
      .addCase(toggleServiceStatus.rejected, (state, action) => {
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
  },
});

export const { setSelectedService, clearError } = serviceSlice.actions;
export default serviceSlice.reducer;
