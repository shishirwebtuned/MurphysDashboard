import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axios';

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender?: string;
  phone?: string;
  country?: string;
  referralSource?: string;
}

export interface UserProfile {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  country?: string;
  city?: string;
  state?: string;
  profile_image?: string;
  role_type?: string;
  status?: string;
}

interface AuthState {
  user: UserProfile | null;
  firebaseUser: any | null;
  loading: boolean;
  error: string | null;
  registrationSuccess: boolean;
  emailVerificationSent: boolean;
}


const initialState: AuthState = {
  user: null,
  firebaseUser: null,
  loading: false,
  error: null,
  registrationSuccess: false,
  emailVerificationSent: false,
};


// Register with email/password
export const registerWithEmail = createAsyncThunk<
  UserProfile,
  RegisterData,
  { rejectValue: string }
>(
  'auth/registerWithEmail',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/auth/register', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        gender: data.gender,
        phone: data.phone,
        country: data.country || 'Australia',
        referralSource: data.referralSource,
      });

      return response.data.data as UserProfile;
    } catch (error: any) {
      // Handle Firebase errors
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            return rejectWithValue('Email already in use');
          case 'auth/weak-password':
            return rejectWithValue('Password is too weak');
          case 'auth/invalid-email':
            return rejectWithValue('Invalid email address');
          default:
            return rejectWithValue(error.message);
        }
      }
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Registration failed'
      );
    }
  }
);



// Get current user
export const getCurrentUser = createAsyncThunk<
  UserProfile,
  void,
  { rejectValue: string }
>(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/auth/me');
      return response.data.data as UserProfile;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user'
      );
    }
  }
);


const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearRegistrationSuccess: (state) => {
      state.registrationSuccess = false;
      state.emailVerificationSent = false;
    },
    setFirebaseUser: (state, action: PayloadAction<any>) => {
      state.firebaseUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register with Email
      .addCase(registerWithEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.registrationSuccess = false;
      })
      .addCase(registerWithEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.registrationSuccess = true;
        state.emailVerificationSent = true;
        state.error = null;
      })
      .addCase(registerWithEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Registration failed';
        state.registrationSuccess = false;
      })


      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch user';
      });
  },
});

export const { clearError, clearRegistrationSuccess, setFirebaseUser } = authSlice.actions;
export default authSlice.reducer;
