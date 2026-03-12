import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Category, CategoryFormData } from '@/types/service';
import axiosInstance from '@/lib/axios';

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const initialState: CategoryState = {
  categories: [],
  loading: false,
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

// Async thunk to fetch all categories
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (
    params: { page?: number; limit?: number } = { page: 1, limit: 100 },
    { rejectWithValue }
  ) => {
    try {
      const { page = 1, limit = 10 } = params;
      const response = await axiosInstance.get('/categories', {
        params: { page, limit },
      });
      // backend returns { data: categories, pagination: { total, page, limit, totalPages } }
      const categories: Category[] = response.data?.data || [];
      const pagination = response.data?.pagination || {};
      return { categories, pagination };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch categories');
    }
  }
);

// Async thunk to create a category
export const createCategory = createAsyncThunk(
  'categories/createCategory',
  async (categoryData: Omit<CategoryFormData, 'status'>, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/categories', categoryData);
      const created: Category = response.data?.data;
      return created;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create category');
    }
  }
);

// Async thunk to update a category
export const updateCategory = createAsyncThunk(
  'categories/updateCategory',
  async ({ _id, data }: { _id: string; data: Omit<CategoryFormData, 'status'> }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/categories/${_id}`, data);
      const updated: Category = response.data?.data;
      return updated;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update category');
    }
  }
);

// Async thunk to delete a category
export const deleteCategory = createAsyncThunk(
  'categories/deleteCategory',
  async (_id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/categories/${_id}`);
      return _id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete category');
    }
  }
);

// Async thunk to toggle category status
export const toggleCategoryStatus = createAsyncThunk(
  'categories/toggleCategoryStatus',
  async ({ _id, status }: { _id: string; status: 'active' | 'inactive' }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/categories/${_id}`, { status });
      const updated = response.data.data;
      return { _id: updated?._id || _id, status: updated?.status || status };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to toggle category status');
    }
  }
);

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.categories = action.payload.categories || [];
        const pagination = action.payload.pagination || {};
        state.page = pagination.page || state.page;
        state.limit = pagination.limit || state.limit;
        state.total = pagination.total || state.total;
        state.totalPages = pagination.totalPages || state.totalPages;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create category
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action: PayloadAction<Category>) => {
        state.loading = false;
        state.categories.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update category
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action: PayloadAction<Category>) => {
        state.loading = false;
        const index = state.categories.findIndex(cat => cat._id === action.payload._id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete category
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.categories = state.categories.filter(cat => cat._id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Toggle category status
      .addCase(toggleCategoryStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleCategoryStatus.fulfilled, (state, action: PayloadAction<{ _id: string; status: 'active' | 'inactive' }>) => {
        state.loading = false;
        const index = state.categories.findIndex(cat => cat._id === action.payload._id);
        if (index !== -1) {
          state.categories[index].status = action.payload.status;
        }
      })
      .addCase(toggleCategoryStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = categorySlice.actions;
export default categorySlice.reducer;
