import { configureStore } from '@reduxjs/toolkit';
import profileReducer from './slices/profileSlice';
import serviceReducer from './slices/serviceSlice';
import categoryReducer from './slices/categorySlice';
import meeReducer from './slices/meeSlice';
import { inviteSlice } from './slices/inviteSlicer';
import assignSlice  from './slices/assignSlice';
import roleReducer from './slices/roleSlice';
import permissionReducer from './slices/permissionSlice';
import siteSettingReducer from './slices/siteSettingSlice';
import  noticeSlice from './slices/noticSlicer';
import dashboardSlice from './slices/dashboardSlicer';
import cartReducer from './slices/cartSlice';
import  billingReducer from './slices/billingSlicer'; 
import InvoiceSlice from './slices/invoiceSlicer';
import ticketReducer from './slices/ticketSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    services: serviceReducer,
    categories: categoryReducer,
    mee: meeReducer,
    invite: inviteSlice.reducer,
    assign: assignSlice,
    role: roleReducer,
    permission: permissionReducer,
    siteSettings: siteSettingReducer,
    notices: noticeSlice,
    dashboard: dashboardSlice,
    cart: cartReducer,
    billing: billingReducer,
    invoices: InvoiceSlice,
    tickets: ticketReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
