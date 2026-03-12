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
    // mirror API naming for user dashboard
    recentServices?: any[];
    stats?: any;
    // User specific fields
    openTickets: number;
    pendingInvoices: number;
    totalSpent: number;
    unpaidInvoices: number;
    unpaidAmount: number;
    resentInvoices: any[];
    // user-specific nested stats
    userStats?: any;
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
    recentServices: [],
    stats: {},
    openTickets: 0,
    pendingInvoices: 0,
    totalSpent: 0,
    unpaidInvoices: 0,
    unpaidAmount: 0,
    resentInvoices: [],
    userStats: {},
    loading: false,
    error: null,
};

export const fetchDashboardStats = createAsyncThunk(
    "dashboard/fetchStats",
    // Accept either a filter string, an options object {filter?, email?}, or nothing for defaults
    async (
        payload: any | undefined,
        { rejectWithValue }
    ) => {
        try {

                const response = await axiosInstance.get("/user-stats", {
                });
                return { ...response.data, isUser: true };
            
           
        } catch (error: any) {
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
            })
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.isUser) {
                    // Populate user specific stats
                    const { stats, recentServices, resentInvoices } = action.payload;
                    // keep a copy of raw user stats and mirror API fields
                    state.userStats = stats || {};
                    state.stats = stats || {};
                    state.recentServices = recentServices || [];
                    state.resentInvoices = resentInvoices || [];
                    // Map individual fields for backward compatibility
                    state.activeService = stats?.activeServices || 0;
                    state.openTickets = stats?.openTickets || 0;
                    state.pendingInvoices = stats?.pendingInvoices || 0;
                    state.totalSpent = stats?.totalSpent || 0;
                    state.unreadNotices = stats?.unreadNotices || 0;
                    state.unpaidInvoices = stats?.unpaidInvoices || 0;
                    state.unpaidAmount = stats?.unpaidAmount || 0;
                    state.recentAssign = recentServices || [];
                    // Reset admin-only counts to avoid showing stale values
                    state.totalServices = 0;
                    state.totalProfiles = 0;
                } else {
                    // Populate admin stats
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
            })
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default dashboardSlice.reducer;
export const dashboardActions = dashboardSlice.actions;
