import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/axios';

/* ================= TYPES ================= */

export interface Ticket {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  assignedServiceId: string;
  assignedServiceName: string;
  problemType: string;
  description: string;
  images: string[];
  publicIds: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  adminResponse?: string;
  adminId?: string;
  adminEmail?: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketState {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ================= INITIAL STATE ================= */

const initialState: TicketState = {
  tickets: [],
  currentTicket: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

/* ================= THUNKS ================= */

// Fetch tickets
export const fetchTickets = createAsyncThunk<
  { data: Ticket[]; pagination: any },
  { page?: number; limit?: number; userId?: string; status?: string } | void,
  { rejectValue: string }
>('tickets/fetchTickets', async (params, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/tickets/user', { params });
    return {
      data: response.data.data as Ticket[],
      pagination: response.data.pagination
    };
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// Fetch single ticket
export const fetchTicketById = createAsyncThunk<
  Ticket,
  string,
  { rejectValue: string }
>('tickets/fetchTicketById', async (id, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get(`/tickets/${id}`);
    return response.data.data as Ticket;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// Create ticket
export const createTicket = createAsyncThunk<
  Ticket,
  FormData,
  { rejectValue: string }
>('tickets/createTicket', async (formData, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data as Ticket;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// Update ticket
export const updateTicket = createAsyncThunk<
  Ticket,
  { id: string; data: FormData | any },
  { rejectValue: string }
>('tickets/updateTicket', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put(`/tickets/${id}`, data, {
      headers: data instanceof FormData 
        ? { 'Content-Type': 'multipart/form-data' }
        : { 'Content-Type': 'application/json' }
    });
    return response.data.data as Ticket;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// Delete ticket
export const deleteTicket = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('tickets/deleteTicket', async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/tickets/${id}`);
    return id;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// Update ticket status
export const updateTicketStatus = createAsyncThunk<
  Ticket,
  { id: string; status: string },
  { rejectValue: string }
>('tickets/updateTicketStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.patch(`/tickets/${id}/status`, { status });
    return response.data.data as Ticket;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

/* ================= SLICE ================= */

const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch tickets
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload.data;
        state.total = action.payload.pagination.total;
        state.page = action.payload.pagination.page;
        state.limit = action.payload.pagination.limit;
        state.totalPages = action.payload.pagination.totalPages;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch tickets';
      })

      // Fetch single ticket
      .addCase(fetchTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTicket = action.payload;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch ticket';
      })

      // Create ticket
      .addCase(createTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to create ticket';
      })

      // Update ticket
      .addCase(updateTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tickets.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.currentTicket?._id === action.payload._id) {
          state.currentTicket = action.payload;
        }
      })
      .addCase(updateTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to update ticket';
      })

      // Delete ticket
      .addCase(deleteTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = state.tickets.filter(t => t._id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to delete ticket';
      })

      // Update status
      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        const index = state.tickets.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.currentTicket?._id === action.payload._id) {
          state.currentTicket = action.payload;
        }
      });
  },
});

export const { clearCurrentTicket, clearError } = ticketSlice.actions;
export default ticketSlice.reducer;
