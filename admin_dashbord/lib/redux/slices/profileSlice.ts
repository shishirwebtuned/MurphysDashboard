import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axios';

export interface ProfileData {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  profile_image?: string;
  country: string;
  state: string;
  city: string;
  position: string;
  gender: 'male' | 'female' | 'other';
  bio: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;

}

interface ProfileState {
  profile: ProfileData | null;
  loading: boolean;
  error: string | null;
  updateSuccess: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  error: null,
  updateSuccess: false,
};

// Async thunks
export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (params: { page?: number; limit?: number; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/profiles', {
        params: {
          populate: 'true',
          page: params.page || 1,
          limit: params.limit || 10,
          search: params.search || '',
        }
      });
      const data = response.data?.data || response.data;
      const pagination = response.data?.pagination || {};
      return { data, pagination };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

// Fetch profile by email (used in UI when we have an email but not an id)
export const fetchProfileByEmail = createAsyncThunk(
  'profile/fetchProfileByEmail',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/profiles/', { params: { email } });
      // backend might return { data: profile } or the profile directly
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile by email');
    }
  }
);

// Update profile accepts { id, formData } so we can send multipart form data when updating images
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/profiles/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

// Create new profile (multipart form data)
export const createProfile = createAsyncThunk(
  'profile/createProfile',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/profiles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create profile');
    }
  }
);

export const uploadProfileImage = createAsyncThunk(
  'profile/uploadImage',
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('profile_image', file);

      const response = await axiosInstance.post('/profiles/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.image_url;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload image');
    }
  }
);
export const deleteProfile = createAsyncThunk(
  'profile/deleteProfile',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/profiles/${id}`);
      return response.data?.data || response.data;
    }
    catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete profile');
    }
  }
);
export const getadminProfile = createAsyncThunk(
  'profile/getadminProfile',
  async (
    params: { role_type?: string; profile_type?: string; page?: number; limit?: number; search?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      // Call /profiles and pass role_type (or profile_type) so server can filter; avoids '/profiles/types' path which may be treated as an id
      const response = await axiosInstance.get('/profiles/types', {
        params: {
          populate: 'true',
          role_type: params.role_type || params.profile_type,
          page: params.page || 1,
          limit: params.limit || 10,
          search: params.search || '',
        },
      });
      console.log('getadminProfile response:', params.role_type || params.profile_type, response.data);

      const data = response.data?.data || response.data;
      const pagination = response.data?.pagination || {};
      return { data, pagination };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch admin profile');
    }
  }
);





// Slice

const profileSlice = createSlice({
  name: 'profile',

  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;

    },
    clearUpdateSuccess: (state) => {
      state.updateSuccess = false;
    },
    setProfile: (state, action: PayloadAction<ProfileData>) => {
      state.profile = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch profile
    builder.addCase(fetchProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.profile = action.payload?.data || action.payload;
      state.total = action.payload.pagination?.total || 0;
      state.page = action.payload.pagination?.page || 1;
      state.limit = action.payload.pagination?.limit || 10;
      state.totalPages = action.payload.pagination?.totalPages || 0;
    });
    builder.addCase(fetchProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch profile by email
    builder.addCase(fetchProfileByEmail.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProfileByEmail.fulfilled, (state, action) => {
      state.loading = false;
      state.profile = action.payload?.data || action.payload;
    });
    builder.addCase(fetchProfileByEmail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update profile
    builder.addCase(updateProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.updateSuccess = false;
    });
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.profile = action.payload?.data || action.payload;
      state.updateSuccess = true;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.updateSuccess = false;
    });

    // Create profile
    builder.addCase(createProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.profile = action.payload?.data || action.payload;
      state.updateSuccess = true;
    });
    builder.addCase(createProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.updateSuccess = false;
    });

    // Upload image
    builder.addCase(uploadProfileImage.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(uploadProfileImage.fulfilled, (state, action) => {
      state.loading = false;
      if (state.profile) {
        state.profile.profile_image = action.payload;
      }
    });
    builder.addCase(uploadProfileImage.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    // Delete profile
    builder.addCase(deleteProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    }
    );
    builder.addCase(deleteProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.profile = null;
      state.total = state.total - 1;

    });
    builder.addCase(deleteProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })
    // Get admin profile
    builder.addCase(getadminProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    }
    );
    builder.addCase(getadminProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.profile = action.payload?.data || action.payload;
      state.total = action.payload.pagination?.total || 0;
      state.page = action.payload.pagination?.page || 1;
      state.limit = action.payload.pagination?.limit || 10;
      state.totalPages = action.payload.pagination?.totalPages || 0;
    });
    builder.addCase(getadminProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

  },
});

export const { clearError, clearUpdateSuccess, setProfile } = profileSlice.actions;
export default profileSlice.reducer;
