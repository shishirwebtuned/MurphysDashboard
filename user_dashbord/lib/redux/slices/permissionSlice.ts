import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axios';

interface PermissionState {
  loading: boolean;
  error: string | null;
}

const initialState: PermissionState = {
  loading: false,
  error: null,
};

// Async thunks
export const toggleUserPermission = createAsyncThunk(
  'permission/toggleUserPermission',
  async ({ userId, permission }: { userId: string; permission: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/permissions/toggle', { userId, permission });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle permission');
    }
  }
);

export const updateUserRoleType = createAsyncThunk(
  'permission/updateUserRoleType',
  async ({ userId, role_type }: { userId: string; role_type: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/permissions/role', { userId, role_type });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update role type');
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  'permission/updateUserStatus',
  async ({ userId, status }: { userId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/permissions/status', { userId, status });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

export const getUserPermissions = createAsyncThunk(
  'permission/getUserPermissions',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/permissions/${userId}`);
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user permissions');
    }
  }
);

const permissionSlice = createSlice({
  name: 'permission',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Toggle user permission
    builder.addCase(toggleUserPermission.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(toggleUserPermission.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(toggleUserPermission.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update user role type
    builder.addCase(updateUserRoleType.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUserRoleType.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(updateUserRoleType.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update user status
    builder.addCase(updateUserStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateUserStatus.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(updateUserStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError } = permissionSlice.actions;
export default permissionSlice.reducer;
