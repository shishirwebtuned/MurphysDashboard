import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/lib/axios";
interface MeeState {
  data: any;
  loading: boolean;
  error: string | null;
}

const initialState: MeeState = {
  data: null,
  loading: false,
  error: null,
};

;

export const getMee = createAsyncThunk(
  "mee/getMee",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/auth/me");
         return response.data.data 
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to get user");
    }
  }
);

const meeSlice = createSlice({
  name: "mee",
  initialState,
  reducers: {
    clearMee: (state) => {
      state.data = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMee.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getMee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearMee } = meeSlice.actions;
export default meeSlice.reducer;
