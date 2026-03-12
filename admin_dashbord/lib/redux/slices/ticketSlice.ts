import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axiosInstance from '@/lib/axios'

export interface Ticket {
  _id: string
  userId: string
  userEmail: string
  userName: string
  assignedServiceId: string
  assignedServiceName: string
  problemType: string
  description: string
  images: string[]
  publicIds: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  adminResponse?: string
  adminId?: string
  adminEmail?: string
  createdAt: string
  updatedAt: string
}

interface TicketState {
  tickets: Ticket[]
  currentTicket: Ticket | null
  loading: boolean
  error: string | null
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
  }
}

const initialState: TicketState = {
  tickets: [],
  currentTicket: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10
  }
}

// Fetch all tickets (admin view)
export const fetchAllTickets = createAsyncThunk(
  'adminTickets/fetchAll',
  async (params: {
    page?: number
    limit?: number
    status?: string
    priority?: string
    userId?: string
    assignedServiceId?: string
  } = {}) => {
    const response = await axiosInstance.get('/tickets', { params })
    return response.data
  }
)

// Fetch ticket by ID
export const fetchTicketById = createAsyncThunk(
  'adminTickets/fetchById',
  async (id: string) => {
    const response = await axiosInstance.get(`/tickets/${id}`)
    return response.data.data
  }
)

// Update ticket status
export const updateTicketStatus = createAsyncThunk(
  'adminTickets/updateStatus',
  async ({ id, status }: { id: string; status: string }) => {
    const response = await axiosInstance.patch(`/tickets/${id}/status`, { status })
    return response.data.data
  }
)

// Add admin response
export const addAdminResponse = createAsyncThunk(
  'adminTickets/addResponse',
  async ({ id, adminResponse, adminId, adminEmail }: { 
    id: string
    adminResponse: string
    adminId: string
    adminEmail: string
  }) => {
    const response = await axiosInstance.put(`/tickets/${id}`, {
      adminResponse,
      adminId,
      adminEmail
    })
    return response.data.data
  }
)

// Delete ticket
export const deleteTicket = createAsyncThunk(
  'adminTickets/delete',
  async (id: string) => {
    await axiosInstance.delete(`/tickets/${id}`)
    return id
  }
)

const ticketSlice = createSlice({
  name: 'adminTickets',
  initialState,
  reducers: {
    clearCurrentTicket: (state) => {
      state.currentTicket = null
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all tickets
      .addCase(fetchAllTickets.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllTickets.fulfilled, (state, action) => {
        state.loading = false
        state.tickets = action.payload.data
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalCount: action.payload.totalCount,
          limit: action.payload.limit
        }
      })
      .addCase(fetchAllTickets.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch tickets'
      })

      // Fetch ticket by ID
      .addCase(fetchTicketById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.loading = false
        state.currentTicket = action.payload
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch ticket'
      })

      // Update ticket status
      .addCase(updateTicketStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        state.loading = false
        if (state.currentTicket) {
          state.currentTicket = action.payload
        }
        const index = state.tickets.findIndex(t => t._id === action.payload._id)
        if (index !== -1) {
          state.tickets[index] = action.payload
        }
      })
      .addCase(updateTicketStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to update status'
      })

      // Add admin response
      .addCase(addAdminResponse.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addAdminResponse.fulfilled, (state, action) => {
        state.loading = false
        if (state.currentTicket) {
          state.currentTicket = action.payload
        }
        const index = state.tickets.findIndex(t => t._id === action.payload._id)
        if (index !== -1) {
          state.tickets[index] = action.payload
        }
      })
      .addCase(addAdminResponse.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to add response'
      })

      // Delete ticket
      .addCase(deleteTicket.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.loading = false
        state.tickets = state.tickets.filter(t => t._id !== action.payload)
        if (state.currentTicket?._id === action.payload) {
          state.currentTicket = null
        }
      })
      .addCase(deleteTicket.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to delete ticket'
      })
  }
})

export const { clearCurrentTicket, clearError } = ticketSlice.actions
export default ticketSlice.reducer
