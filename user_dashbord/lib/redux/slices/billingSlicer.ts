import axiosInstance from "@/lib/axios";

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface RenewalDate {
    _id: string;
    label: string;
    date: string;
    price: number;
    haspaid: boolean;
}

export interface BillingInfo {
    _id: string;
    invoice_id: string;
    client_id: string;
    assign_by: string;
    client_name: string;
    service_catalog_id: string;
    service_name: string;
    status: string;
    price: string;
    cycle: string;
    start_date: string;
    end_date: string;
    auto_invoice: boolean;
    isaccepted: string;
    email: string;
    renewal_dates: RenewalDate[];
    createdAt: string;
    updatedAt: string;
}


interface BillingState {
    billingInfo: BillingInfo[];
    loading: boolean;
    error: string | null;
}

const initialState: BillingState = {
    billingInfo: [],
    loading: false,
    error: null,
};

export const fetchBillingInfo = createAsyncThunk(
    "billing/fetchBillingInfo",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/billing/info");
            return response.data?.data || [];
        }
        catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch billing info");
        }
    }
);


const billingSlice = createSlice({
    name: "billing",
    initialState,
    reducers: {
        resetBilling: (state) => {
            state.billingInfo = [];
            state.loading = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBillingInfo.pending, (state) => {
                state.loading = true;
                state.error = null;
            }
            )
            .addCase(fetchBillingInfo.fulfilled, (state, action: PayloadAction<BillingInfo[]>) => {
                state.loading = false;
                state.billingInfo = action.payload;
            }
            )
            .addCase(fetchBillingInfo.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            }
            );
    }
});
export const { resetBilling } = billingSlice.actions;
export default billingSlice.reducer;