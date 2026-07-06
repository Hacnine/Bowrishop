import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import { logout, setTokens } from '../auth/authSlice';

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

let refreshPromise: Promise<RefreshResponse | undefined> | null = null;

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshToken = (api.getState() as RootState).auth.refreshToken;

    if (!refreshToken) {
      api.dispatch(logout());
      return result;
    }

    refreshPromise ??= (async () => {
      const refreshResult = await rawBaseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        return refreshResult.data as RefreshResponse;
      }

      return undefined;
    })();

    const newTokens = await refreshPromise;
    refreshPromise = null;

    if (newTokens) {
      api.dispatch(setTokens(newTokens));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Products', 'Product', 'Categories', 'Cart', 'Wishlist',
    'Orders', 'Order', 'Reviews', 'Coupons', 'Inquiries',
    'Profile', 'Users', 'AdminStats',
  ],
  endpoints: () => ({}),
});
