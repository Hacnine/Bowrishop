import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../features/api/baseApi';
import authReducer from '../features/auth/authSlice';
import guestCartReducer from '../features/cart/guestCartSlice';

export const makeStore = () =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      auth: authReducer,
      guestCart: guestCartReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

// Client-side singleton — browser এ একটাই instance
export const store = makeStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = ReturnType<typeof makeStore>;