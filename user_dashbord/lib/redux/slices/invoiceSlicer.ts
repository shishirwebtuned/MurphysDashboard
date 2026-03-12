import { createAsyncThunk  } from "@reduxjs/toolkit";
import { createSlice , } from "@reduxjs/toolkit";
import axiosInstance from "../../axios";

interface Invoice {
    id: string;
    amount: number;
    status: string;
    date: string;
    // Add other invoice properties as needed
}

export const fetchInvoices = createAsyncThunk(
  "invoices/fetchInvoices",
  async (id: string, { rejectWithValue } ) => {
    try {
      const response = await axiosInstance.get(`/invoices/${id}`);
      const results = response.data;
      return results;
    } catch (error: any) {
      return rejectWithValue(error.response?.data ?? error.message);
    }
  }
);


interface InvoiceState {    
    invoice: any | null;
    invoices: Invoice[];
    loading: boolean;
    error: string | null;
}
const initialState: InvoiceState = {
    invoice: null,
    invoices: [],
    loading: false,
    error: null,
};
const invoiceSlice = createSlice({
    name: "invoices",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchInvoices.pending, (state) => {
                state.loading = true;
                state.error = null;
            }
            )
            .addCase(fetchInvoices.fulfilled, (state, action) => {
                state.loading = false;
                state.invoice = action.payload.data;
            }
            )
            .addCase(fetchInvoices.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            }
            );
    },
});
export default invoiceSlice.reducer;
export const {} = invoiceSlice.actions;


