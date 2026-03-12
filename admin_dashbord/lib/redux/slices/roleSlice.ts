import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axios';

export interface Permission {
  key: string;
  label: string;
  category: string;
}

export interface RoleData {
  _id?: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RoleState {
  roles: RoleData[];
  currentRole: RoleData | null;
  availablePermissions: Permission[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const initialState: RoleState = {
  roles: [],
  currentRole: null,
  availablePermissions: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
};

// Async thunks
export const fetchRoles = createAsyncThunk(
  'role/fetchRoles',
  async (params: { page?: number; limit?: number; search?: string; isActive?: boolean } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/roles', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch roles');
    }
  }
);

export const fetchRoleById = createAsyncThunk(
  'role/fetchRoleById',
  async (roleId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/roles/${roleId}`);
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch role');
    }
  }
);

export const createRole = createAsyncThunk(
  'role/createRole',
  async (roleData: Partial<RoleData>, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/roles', roleData);
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create role');
    }
  }
);

export const updateRole = createAsyncThunk(
  'role/updateRole',
  async ({ roleId, roleData }: { roleId: string; roleData: Partial<RoleData> }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/roles/${roleId}`, roleData);
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update role');
    }
  }
);

export const deleteRole = createAsyncThunk(
  'role/deleteRole',
  async (roleId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/roles/${roleId}`);
      return roleId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete role');
    }
  }
);

export const toggleRolePermission = createAsyncThunk(
  'role/toggleRolePermission',
  async ({ roleId, permission }: { roleId: string; permission: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/roles/permissions/toggle', { roleId, permission });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle permission');
    }
  }
);

export const assignRoleToUser = createAsyncThunk(
  'role/assignRoleToUser',
  async ({ userId, roleId }: { userId: string; roleId: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/roles/assign', { userId, roleId });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign role');
    }
  }
);

export const fetchAvailablePermissions = createAsyncThunk(
  'role/fetchAvailablePermissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/permissions/available');
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permissions');
    }
  }
);

export const getUsersByRole = createAsyncThunk(
  'role/getUsersByRole',
  async ({ roleId, params }: { roleId: string; params?: any }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/roles/${roleId}/users`, { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

const roleSlice = createSlice({
  name: 'role',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentRole: (state, action: PayloadAction<RoleData | null>) => {
      state.currentRole = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch roles
    builder.addCase(fetchRoles.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRoles.fulfilled, (state, action) => {
      state.loading = false;
      state.roles = action.payload?.data || action.payload;
      state.total = action.payload?.pagination?.total || 0;
      state.page = action.payload?.pagination?.page || 1;
      state.limit = action.payload?.pagination?.limit || 20;
      state.totalPages = action.payload?.pagination?.totalPages || 0;
    });
    builder.addCase(fetchRoles.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch role by ID
    builder.addCase(fetchRoleById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRoleById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentRole = action.payload;
    });
    builder.addCase(fetchRoleById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create role
    builder.addCase(createRole.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createRole.fulfilled, (state, action) => {
      state.loading = false;
      state.roles.push(action.payload);
    });
    builder.addCase(createRole.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update role
    builder.addCase(updateRole.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateRole.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.roles.findIndex(r => r._id === action.payload._id);
      if (index !== -1) {
        state.roles[index] = action.payload;
      }
    });
    builder.addCase(updateRole.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete role
    builder.addCase(deleteRole.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteRole.fulfilled, (state, action) => {
      state.loading = false;
      state.roles = state.roles.filter(r => r._id !== action.payload);
    });
    builder.addCase(deleteRole.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Toggle role permission
    builder.addCase(toggleRolePermission.fulfilled, (state, action) => {
      const roleData = action.payload?.data;
      if (roleData && roleData._id) {
        const index = state.roles.findIndex(r => r._id === roleData._id);
        if (index !== -1) {
          state.roles[index] = roleData;
        }
      }
    });

    // Fetch available permissions (normalize multiple possible response shapes)
    builder.addCase(fetchAvailablePermissions.fulfilled, (state, action) => {
      const payload = action.payload as any
      if (Array.isArray(payload)) {
        state.availablePermissions = payload
      } else if (Array.isArray(payload?.data)) {
        state.availablePermissions = payload.data
      } else if (Array.isArray(payload?.permissions)) {
        state.availablePermissions = payload.permissions
      } else {
        // unknown shape — clear to avoid runtime errors
        state.availablePermissions = []
      }
    });
  },
});

export const { clearError, setCurrentRole } = roleSlice.actions;
export default roleSlice.reducer;
