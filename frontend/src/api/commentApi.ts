import { baseApi } from './baseApi';
import { ApiSuccess, Comment } from '@/types';

export const commentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTaskComments: builder.query<ApiSuccess<Comment[]>, number>({
      query: (taskId) => `/comments/task/${taskId}`,
      providesTags: (_result, _err, taskId) => [{ type: 'Comments', id: taskId }],
    }),
    addComment: builder.mutation<ApiSuccess<Comment>, { taskId: number; content: string }>({
      query: (body) => ({ url: '/comments', method: 'POST', body }),
      invalidatesTags: (_result, _err, arg) => [{ type: 'Comments', id: arg.taskId }],
    }),
  }),
});

export const { useGetTaskCommentsQuery, useAddCommentMutation } = commentApi;
