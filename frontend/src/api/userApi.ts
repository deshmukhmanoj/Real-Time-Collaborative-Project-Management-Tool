import { baseApi } from './baseApi';
import { ApiSuccess, User } from '@/types';

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    lookupUserByEmail: builder.query<ApiSuccess<User>, string>({
      query: (email) => `/users/lookup?email=${encodeURIComponent(email)}`,
    }),
  }),
});

export const { useLazyLookupUserByEmailQuery } = userApi;
