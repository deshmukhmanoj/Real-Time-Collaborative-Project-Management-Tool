import { baseApi } from './baseApi';
import { boardApi } from './boardApi';
import { ApiSuccess, ListColumn, Task, TaskPriority } from '@/types';

interface CreateTaskArgs {
  listId: number;
  boardId: number;
  title: string;
}

interface UpdateTaskArgs {
  taskId: number;
  boardId: number;
  title: string;
  description?: string | null;
  assignedTo?: number | null;
  dueDate?: string | null;
  priority?: TaskPriority;
}

interface MoveTaskArgs {
  taskId: number;
  boardId: number;
  sourceListId: number;
  newListId: number;
  newPosition: number;
}

interface ToggleCompleteArgs {
  taskId: number;
  boardId: number;
  isCompleted: boolean;
}

interface DeleteTaskArgs {
  taskId: number;
  boardId: number;
  listId: number;
}

export const taskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createTask: builder.mutation<ApiSuccess<Task>, CreateTaskArgs>({
      query: ({ listId, boardId, title }) => ({
        url: '/tasks',
        method: 'POST',
        body: { listId, boardId, title },
      }),
      invalidatesTags: (_result, _err, arg) => [{ type: 'BoardFull', id: arg.boardId }],
    }),

    updateTask: builder.mutation<ApiSuccess<{ message: string }>, UpdateTaskArgs>({
      query: ({ taskId, boardId: _boardId, ...body }) => ({
        url: `/tasks/${taskId}`,
        method: 'PATCH',
        body,
      }),
      async onQueryStarted(
        { taskId, boardId, title, description, assignedTo, dueDate, priority },
        { dispatch, queryFulfilled }
      ) {
        const patch = dispatch(
          boardApi.util.updateQueryData('getBoardFull', boardId, (draft) => {
            for (const list of draft.data.lists) {
              const task = list.tasks.find((t) => t.id === taskId);
              if (task) {
                task.title = title;
                if (description !== undefined) task.description = description;
                if (assignedTo !== undefined) task.assigned_to = assignedTo;
                if (dueDate !== undefined) task.due_date = dueDate;
                if (priority !== undefined) task.priority = priority;
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    moveTask: builder.mutation<ApiSuccess<{ message: string }>, MoveTaskArgs>({
      query: ({ taskId, newListId, newPosition }) => ({
        url: `/tasks/${taskId}/move`,
        method: 'PATCH',
        body: { newListId, newPosition },
      }),
      async onQueryStarted(
        { taskId, boardId, sourceListId, newListId, newPosition },
        { dispatch, queryFulfilled }
      ) {
        const patch = dispatch(
          boardApi.util.updateQueryData('getBoardFull', boardId, (draft) => {
            const source = draft.data.lists.find((l) => l.id === sourceListId);
            const dest = draft.data.lists.find((l) => l.id === newListId);
            if (!source || !dest) return;

            const taskIdx = source.tasks.findIndex((t) => t.id === taskId);
            if (taskIdx === -1) return;

            const [task] = source.tasks.splice(taskIdx, 1);
            task.list_id = newListId;
            task.position = newPosition;
            dest.tasks.splice(Math.min(newPosition - 1, dest.tasks.length), 0, task);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    toggleTaskComplete: builder.mutation<ApiSuccess<{ message: string }>, ToggleCompleteArgs>({
      query: ({ taskId, isCompleted }) => ({
        url: `/tasks/${taskId}/complete`,
        method: 'PATCH',
        body: { isCompleted },
      }),
      async onQueryStarted({ taskId, boardId, isCompleted }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          boardApi.util.updateQueryData('getBoardFull', boardId, (draft) => {
            for (const list of draft.data.lists) {
              const task = list.tasks.find((t) => t.id === taskId);
              if (task) task.is_completed = isCompleted;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
    }),

    deleteTask: builder.mutation<ApiSuccess<{ message: string }>, DeleteTaskArgs>({
      query: ({ taskId }) => ({ url: `/tasks/${taskId}`, method: 'DELETE' }),
      async onQueryStarted({ taskId, boardId, listId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          boardApi.util.updateQueryData('getBoardFull', boardId, (draft) => {
            const list = draft.data.lists.find((l: ListColumn) => l.id === listId);
            if (list) {
              list.tasks = list.tasks.filter((t) => t.id !== taskId);
            }
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
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useMoveTaskMutation,
  useToggleTaskCompleteMutation,
  useDeleteTaskMutation,
} = taskApi;
