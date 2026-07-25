import { baseApi } from './baseApi';
import { ActivityItem, ApiSuccess } from '@/types';

export const activityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTaskActivity: builder.query<ApiSuccess<ActivityItem[]>, number>({
      query: (taskId) => `/activity/task/${taskId}`,
      providesTags: (_result, _err, taskId) => [{ type: 'Activity', id: taskId }],
    }),
    getBoardActivity: builder.query<ApiSuccess<ActivityItem[]>, number>({
      query: (boardId) => `/activity/board/${boardId}`,
      providesTags: (_result, _err, boardId) => [{ type: 'Activity', id: `board-${boardId}` }],
    }),
  }),
});

export const { useGetTaskActivityQuery, useGetBoardActivityQuery } = activityApi;
