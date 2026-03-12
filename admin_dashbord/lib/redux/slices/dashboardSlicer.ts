import axiosInstance from "@/lib/axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface DashboardState {  
    totalProfiles: number;
    totalServices: number;
    totalAssigned: number;
    totalNotices: number;
    unreadNotices: number;
    totalCategories: number;
    activeService: number;
    inactiveService: number;
    recentAssign: any[];
    loading: boolean;
    error: string | null;
}
const initialState: DashboardState = {
    totalProfiles: 0,
    totalServices: 0,
    totalAssigned: 0,
    totalNotices: 0,
    unreadNotices: 0,
    totalCategories: 0,
    activeService: 0,
    inactiveService: 0,
    recentAssign: [],
    loading: false,
    error: null,
};
export const fetchDashboardStats = createAsyncThunk(
    "dashboard/fetchStats",
    async (filter: string = 'all', { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/stats", {
                params: { filter }
            });
            return response.data;
        }
        catch (error: any) {
            return rejectWithValue(error.response?.data?.error || "Failed to fetch dashboard stats");
        }
    }
);
const dashboardSlice = createSlice({
    name: "dashboard",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardStats.pending, (state) => {
                state.loading = true;
                state.error = null;
            }
            )
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                state.loading = false;
                state.totalProfiles = action.payload.totalProfiles;
                state.totalServices = action.payload.totalServices;
                state.totalAssigned = action.payload.totalAssigned;
                state.totalNotices = action.payload.totalNotices;
                state.unreadNotices = action.payload.unreadNotices;
                state.totalCategories = action.payload.totalCategories;
                state.activeService = action.payload.activeService;
                state.inactiveService = action.payload.inactiveService;
                state.recentAssign = action.payload.recentAssign;
            }
            )
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            }
            );
    },
});
export default dashboardSlice.reducer;
export const dashboardActions = dashboardSlice.actions;
