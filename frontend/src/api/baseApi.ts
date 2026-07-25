import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import { Mutex } from './mutex';
import type { RootState } from '@/app/store';
import { setAccessToken, logout } from '@/features/auth/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const mutex = new Mutex();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Wraps the base query: if a request comes back 401, tries a silent refresh
// once, then retries the original request. If refresh also fails, logs out.
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  await mutex.waitForUnlock();
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshToken = (api.getState() as RootState).auth.refreshToken;

        if (!refreshToken) {
          api.dispatch(logout());
          return result;
        }

        const refreshResult = await rawBaseQuery(
          { url: '/auth/refresh-token', method: 'POST', body: { refreshToken } },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const newAccessToken = (refreshResult.data as any).data.accessToken as string;
          api.dispatch(setAccessToken(newAccessToken));
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          api.dispatch(logout());
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Workspace', 'WorkspaceMembers', 'Board', 'BoardFull', 'Comments', 'Activity'],
  endpoints: () => ({}),
});
