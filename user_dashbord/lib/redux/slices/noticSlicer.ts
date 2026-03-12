import axiosInstance from "@/lib/axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

/* ================= TYPES ================= */

export interface Notice {
  _id: string;
  firstName: string;
  lastName: string;
  title: string;
  message: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  status: boolean;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface NoticeState {
  notices: Notice[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

/* ================= INITIAL STATE ================= */

const initialState: NoticeState = {
  notices: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  unreadCount: 0,
};

/* ================= THUNKS ================= */

/** Fetch notices (with pagination) */
export const fetchNotices = createAsyncThunk<
  { data: Notice[]; pagination: Pagination; unreadCount: number },
  { page?: number; limit?: number; email?: string } | void,
  { rejectValue: string }
>("notices/fetchNotices", async (params, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get("/notices", {
      params: {
        page: params?.page,
        limit: params?.limit,
        email: params?.email

      },
    });

    const paginationRaw = response.data.pagination || {};
    const pagination: Pagination = {
      total: paginationRaw.total ?? paginationRaw.Total ?? 0,
      page: paginationRaw.page ?? paginationRaw.Page ?? 1,
      limit: paginationRaw.limit ?? 10,
      totalPages: paginationRaw.totalPages ?? paginationRaw.TotalPages ?? 0,
    };

    const unreadCount = typeof response.data.unreadCount === 'number' ? response.data.unreadCount : 0;

    return {
      data: response.data.data as Notice[],
      pagination,
      unreadCount,
    };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message
    );
  }
});

/** Create notice */
export const createNotice = createAsyncThunk<
  Notice,
  Partial<Notice>,
  { rejectValue: string }
>("notices/createNotice", async (noticeData, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post("/notices", noticeData);
    return response.data as Notice;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message
    );
  }
});

/** Delete notice */
export const deleteNotice = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("notices/deleteNotice", async (noticeId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/notices/${noticeId}`);
    return noticeId;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message
    );
  }
});

export const toggleNoticeStatus = createAsyncThunk<
  { data: Notice; unreadCount: number },
  { noticeId: string; status: boolean },
  { rejectValue: string }
>("notices/toggleNoticeStatus", async ({ noticeId, status }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(`/notices/toggleStatus`, { noticeId, status });
    const data = response.data;
    return {
      data: data.data as Notice,
      unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : 0,
    };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message
    );
  }
});



/** Delete multiple notices */
export const deleteManyNotices = createAsyncThunk<
  string[],
  string[],
  { rejectValue: string }
>("notices/deleteManyNotices", async (ids, { rejectWithValue }) => {
  try {
    await axiosInstance.post("/notices/delete-many", { ids });
    return ids;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message
    );
  }
});

/** Mark all notices as read */
export const markAllNoticesRead = createAsyncThunk<
  { unreadCount: number },
  void,
  { rejectValue: string }
>("notices/markAllNoticesRead", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post("/notices/mark-all-read");
    return {
      unreadCount: typeof response.data.unreadCount === 'number' ? response.data.unreadCount : 0
    };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || error.message
    );
  }
});


/* ================= SLICE ================= */

const noticeSlice = createSlice({
  name: "notices",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* FETCH */
      .addCase(fetchNotices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotices.fulfilled, (state, action) => {
        state.loading = false;
        // normalize status to boolean in all notices (backend may return string or boolean)
        state.notices = action.payload.data.map(n => {
          const rawStatus = (n as any).status;
          const statusBool = rawStatus === true || rawStatus === 'true' || rawStatus === 1 || rawStatus === '1';
          return { ...n, status: !!statusBool };
        });
        state.total = action.payload.pagination.total;
        state.page = action.payload.pagination.page;
        state.limit = action.payload.pagination.limit;
        state.totalPages = action.payload.pagination.totalPages;
        // unreadCount should come from backend when available; don't derive from paginated page
        state.unreadCount = typeof action.payload.unreadCount === 'number'
          ? action.payload.unreadCount
          : state.unreadCount;
      })
      .addCase(fetchNotices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch notices";
      })



      /* CREATE */
      .addCase(createNotice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNotice.fulfilled, (state, action) => {
        state.loading = false;
        state.notices.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createNotice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to create notice";
      })

      /* DELETE */
      .addCase(deleteNotice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNotice.fulfilled, (state, action) => {
        state.loading = false;
        state.notices = state.notices.filter(
          (notice) => notice._id !== action.payload
        );
        state.total -= 1;
      })
      .addCase(deleteNotice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to delete notice";
      })
      /* TOGGLE STATUS */
      .addCase(toggleNoticeStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleNoticeStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const updated = action.payload.data;
        const index = state.notices.findIndex(notice => notice._id === updated._id);
        const rawStatus = (updated as any).status;
        const statusBool = rawStatus === true || rawStatus === 'true' || rawStatus === 1 || rawStatus === '1';
        const normalized = { ...updated, status: !!statusBool };
        if (index !== -1) {
          state.notices[index] = normalized;
        } else {
          state.notices.unshift(normalized);
        }
        // use unreadCount from backend when provided
        state.unreadCount = typeof action.payload.unreadCount === 'number' ? action.payload.unreadCount : state.unreadCount;
      })
      .addCase(toggleNoticeStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to toggle notice status";
      })

      /* DELETE MANY */
      .addCase(deleteManyNotices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteManyNotices.fulfilled, (state, action) => {
        state.loading = false;
        // Filter out deleted notices
        state.notices = state.notices.filter(
          (notice) => !action.payload.includes(notice._id)
        );
        // Decrease total by number of deleted items
        state.total -= action.payload.length;
      })
      .addCase(deleteManyNotices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to delete notices";
      })

      /* MARK ALL READ */
      .addCase(markAllNoticesRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAllNoticesRead.fulfilled, (state, action) => {
        state.loading = false;
        // Set all to read locally
        state.notices = state.notices.map(notice => ({ ...notice, status: true }));
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(markAllNoticesRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to mark all as read";
      });


  },
});

export default noticeSlice.reducer;
