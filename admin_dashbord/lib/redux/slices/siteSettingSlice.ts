import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axios';

export interface SiteSettings {
  _id?: string;
  appName: string;
  description: string;
  logo: string;
  publicid?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  footerText: string;
  currency: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    linkedin: string;
    instagram: string;
  };
  maintenanceMode: boolean;
}

interface SiteSettingState {
  settings: SiteSettings | null;
  loading: boolean;
  error: string | null;
  updating: boolean;
}

const initialState: SiteSettingState = {
  settings: null,
  loading: false,
  error: null,
  updating: false,
};

export const fetchSiteSettings = createAsyncThunk(
  'siteSettings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/settings');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch settings');
    }
  }
);

export const updateSiteSettings = createAsyncThunk(
  'siteSettings/update',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put('/settings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update settings');
    }
  }
);

const siteSettingSlice = createSlice({
  name: 'siteSettings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchSiteSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSiteSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSiteSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update
      .addCase(updateSiteSettings.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateSiteSettings.fulfilled, (state, action) => {
        state.updating = false;
        state.settings = action.payload;
      })
      .addCase(updateSiteSettings.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      });
  },
});

export default siteSettingSlice.reducer;
