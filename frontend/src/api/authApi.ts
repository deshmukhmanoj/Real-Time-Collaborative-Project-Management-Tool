import { baseApi } from './baseApi';
import { ApiSuccess, User } from '@/types';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<
      ApiSuccess<User>,
      { name: string; email: string; password: string }
    >({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation<ApiSuccess<AuthResponse>, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    logoutUser: builder.mutation<ApiSuccess<{ message: string }>, { refreshToken: string }>({
      query: (body) => ({ url: '/auth/logout', method: 'POST', body }),
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useLogoutUserMutation } = authApi;
