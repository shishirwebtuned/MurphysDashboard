import axiosInstance from '@/lib/axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';


export interface InviteState {
    loading: boolean;
    error: string | null;
    success: boolean;
    items: any[];
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const createInvite = createAsyncThunk(
    'invite/createInvite',
    async (formData: any) => {
        try {
            const response = await axiosInstance.post('/send-invite', formData);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to create invite');
        }
    }
);

export const updateInvite = createAsyncThunk(
    'invite/updateInvite',
    async ({ id, formData }: { id: string; formData: any }) => {
        try {
            const response = await axiosInstance.put(`/invites/${id}`, formData);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update invite');
        }
    }
);

export const resendInvite = createAsyncThunk(
    'invite/resendInvite',
    async ({ id }: { id: string }) => {
        try {
            
            const response = await axiosInstance.post(`/resend-invite`, { id });
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to resend invite');
        }
    }
);

export const getinvite = createAsyncThunk(
    'invite/getInvite',
    async ({ page = 1, limit = 10 }: { page?: number; limit?: number } = {}) => {
        try {
            const response = await axiosInstance.get(`/invites?page=${page}&limit=${limit}`);
            // Expect backend to return { data: invites, pagination: { total, page, limit, totalPages } }
            return {
                data: response.data.data || [],
                pagination: response.data.pagination || { total: 0, page, limit, totalPages: 0 },
            };
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to fetch invites');
        }
    }
);

export const deleteInvite = createAsyncThunk(
    'invite/deleteInvite',
    async (id: string) => {
        try {
            const response = await axiosInstance.delete(`/invites/${id}`);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete invite');
        }
    }
);


const initialState: InviteState = {
    loading: false,
    error: null,
    success: false,
    items: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
};

export const inviteSlice = createSlice({
    name: 'invite',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createInvite.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createInvite.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // add the newly created invite to items if returned
                if (action.payload) {
                    state.items = [action.payload, ...state.items];
                }
            })
            .addCase(createInvite.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to create invite';
            })
            .addCase(getinvite.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(getinvite.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // action.payload has shape { data, pagination }
                state.items = action.payload?.data || [];
                // store pagination if provided
                (state as any).pagination = action.payload?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };
            })
            .addCase(getinvite.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch invites';
            })
            .addCase(updateInvite.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateInvite.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                if (action.payload) {
                    state.items = state.items.map((it) => (it._id === action.payload._id || it.id === action.payload.id) ? action.payload : it);
                }
            })
            .addCase(updateInvite.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update invite';
            })
            .addCase(resendInvite.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(resendInvite.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // If updated invite returned, merge it; otherwise leave as-is.
                if (action.payload) {
                    state.items = state.items.map((it) => (it._id === action.payload._id || it.id === action.payload.id) ? action.payload : it);
                }
            })
            .addCase(resendInvite.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to resend invite';
            })
            .addCase(deleteInvite.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            }
            )
            .addCase(deleteInvite.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.items = state.items.filter((it) => it._id !== action.meta.arg && it.id !== action.meta.arg);
            }
            )
            .addCase(deleteInvite.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to delete invite';
            }
            );
            

    }
});

export const inviteReducer = inviteSlice.reducer;




