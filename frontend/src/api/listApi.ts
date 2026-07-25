import { baseApi } from './baseApi';
import { boardApi } from './boardApi';
import { ApiSuccess, ListColumn } from '@/types';

export const listApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createList: builder.mutation<
      ApiSuccess<{ id: number; title: string; position: number }>,
      { boardId: number; title: string }
    >({
      query: (body) => ({ url: '/lists', method: 'POST', body }),
      invalidatesTags: (_result, _err, arg) => [{ type: 'BoardFull', id: arg.boardId }],
    }),
    reorderList: builder.mutation<
      ApiSuccess<{ message: string }>,
      { boardId: number; listId: number; position: number }
    >({
      query: ({ listId, position }) => ({
        url: `/lists/${listId}/reorder`,
        method: 'PATCH',
        body: { position },
      }),
      async onQueryStarted({ boardId, listId, position }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          boardApi.util.updateQueryData('getBoardFull', boardId, (draft) => {
            const list = draft.data.lists.find((l: ListColumn) => l.id === listId);
            if (list) list.position = position;
            draft.data.lists.sort((a: ListColumn, b: ListColumn) => a.position - b.position);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    renameList: builder.mutation<
      ApiSuccess<{ id: number; title: string }>,
      { boardId: number; listId: number; title: string }
    >({
      query: ({ listId, title }) => ({
        url: `/lists/${listId}`,
        method: 'PATCH',
        body: { title },
      }),
      async onQueryStarted({ boardId, listId, title }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          boardApi.util.updateQueryData('getBoardFull', boardId, (draft) => {
            const list = draft.data.lists.find((l: ListColumn) => l.id === listId);
            if (list) list.title = title;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    deleteList: builder.mutation<
      ApiSuccess<{ message: string }>,
      { boardId: number; listId: number }
    >({
      query: ({ listId }) => ({ url: `/lists/${listId}`, method: 'DELETE' }),
      async onQueryStarted({ boardId, listId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          boardApi.util.updateQueryData('getBoardFull', boardId, (draft) => {
            draft.data.lists = draft.data.lists.filter((l: ListColumn) => l.id !== listId);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),
  }),
});

export const {
  useCreateListMutation,
  useReorderListMutation,
  useRenameListMutation,
  useDeleteListMutation,
} = listApi;