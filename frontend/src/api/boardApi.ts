import { baseApi } from './baseApi';
import { ApiSuccess, Board, BoardFull } from '@/types';

export const boardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkspaceBoards: builder.query<ApiSuccess<Board[]>, number>({
      query: (workspaceId) => `/boards/workspace/${workspaceId}`,
      providesTags: (_result, _err, workspaceId) => [{ type: 'Board', id: workspaceId }],
    }),
    createBoard: builder.mutation<ApiSuccess<Board>, { workspaceId: number; title: string }>({
      query: (body) => ({ url: '/boards', method: 'POST', body }),
      invalidatesTags: (_result, _err, arg) => [{ type: 'Board', id: arg.workspaceId }],
    }),
    getBoardFull: builder.query<ApiSuccess<BoardFull>, number>({
      query: (boardId) => `/boards/${boardId}/full`,
      providesTags: (_result, _err, boardId) => [{ type: 'BoardFull', id: boardId }],
    }),
  }),
});

export const { useGetWorkspaceBoardsQuery, useCreateBoardMutation, useGetBoardFullQuery } =
  boardApi;
