import { useEffect } from 'react';
import { useSocket } from './SocketProvider';
import { useAppDispatch } from '@/app/hooks';
import { boardApi } from '@/api/boardApi';
import { commentApi } from '@/api/commentApi';
import { Task } from '@/types';

/**
 * Joins the board's Socket.io room and keeps the RTK Query cache for
 * getBoardFull(boardId) in sync with events broadcast by other collaborators.
 * All patches are written defensively (existence checks) so they're safe
 * to apply even if this client already made the same change optimistically.
 */
export function useBoardSocket(boardId: number | undefined) {
  const socket = useSocket();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!socket || !boardId) return;

    socket.emit('board:join', boardId);

    const onTaskCreated = ({ listId, task }: { listId: number; task: Task }) => {
      dispatch(
        boardApi.util.updateQueryData('getBoardFull', boardId, (draft) => {
          const list = draft.data.lists.find((l) => l.id === listId);
          if (list && !list.tasks.some((t) => t.id === task.id)) {
            list.tasks.push(task);
          }
        })
      );
    };

    const onTaskUpdated = (payload: Partial<Task> & { id: number }) => {
      dispatch(
        boardApi.util.updateQueryData('getBoardFull', boardId, (draft) => {
          for (const list of draft.data.lists) {
            const task = list.tasks.find((t) => t.id === payload.id);
            if (task) Object.assign(task, payload);
          }
        })
      );
    };

    const onTaskMoved = ({
      taskId,
      newListId,
      newPosition,
    }: {
      taskId: number;
      newListId: number;
      newPosition: number;
    }) => {
      dispatch(
        boardApi.util.updateQueryData('getBoardFull', boardId, (draft) => {
          const dest = draft.data.lists.find((l) => l.id === newListId);
          if (!dest) return;
          if (dest.tasks.some((t) => t.id === taskId && t.list_id === newListId)) return;

          for (const list of draft.data.lists) {
            const idx = list.tasks.findIndex((t) => t.id === taskId);
            if (idx !== -1) {
              const [task] = list.tasks.splice(idx, 1);
              task.list_id = newListId;
              task.position = newPosition;
              dest.tasks.splice(Math.min(newPosition - 1, dest.tasks.length), 0, task);
              break;
            }
          }
        })
      );
    };

    const onTaskCompleted = ({
      taskId,
      isCompleted,
    }: {
      taskId: number;
      isCompleted: boolean;
    }) => {
      dispatch(
        boardApi.util.updateQueryData('getBoardFull', boardId, (draft) => {
          for (const list of draft.data.lists) {
            const task = list.tasks.find((t) => t.id === taskId);
            if (task) task.is_completed = isCompleted;
          }
        })
      );
    };

    const onTaskDeleted = ({ taskId }: { taskId: number }) => {
      dispatch(
        boardApi.util.updateQueryData('getBoardFull', boardId, (draft) => {
          for (const list of draft.data.lists) {
            list.tasks = list.tasks.filter((t) => t.id !== taskId);
          }
        })
      );
    };

    const onListCreated = (list: { id: number; title: string; position: number }) => {
      dispatch(
        boardApi.util.updateQueryData('getBoardFull', boardId, (draft) => {
          if (!draft.data.lists.some((l) => l.id === list.id)) {
            draft.data.lists.push({ ...list, tasks: [] });
            draft.data.lists.sort((a, b) => a.position - b.position);
          }
        })
      );
    };

    const onListRenamed = ({ listId, title }: { listId: number; title: string }) => {
      dispatch(
        boardApi.util.updateQueryData('getBoardFull', boardId, (draft) => {
          const list = draft.data.lists.find((l) => l.id === listId);
          if (list) list.title = title;
        })
      );
    };

    const onListDeleted = ({ listId }: { listId: number }) => {
      dispatch(
        boardApi.util.updateQueryData('getBoardFull', boardId, (draft) => {
          draft.data.lists = draft.data.lists.filter((l) => l.id !== listId);
        })
      );
    };

    const onCommentAdded = ({
      taskId,
      comment,
    }: {
      taskId: number;
      comment: { id: number; content: string; created_at: string; userId: number; userName: string };
    }) => {
      dispatch(
        commentApi.util.updateQueryData('getTaskComments', taskId, (draft) => {
          if (!draft.data.some((c) => c.id === comment.id)) {
            draft.data.push({
              id: comment.id,
              content: comment.content,
              created_at: comment.created_at,
              user_id: comment.userId,
              user_name: comment.userName,
            });
          }
        })
      );
    };

    socket.on('task:created', onTaskCreated);
    socket.on('task:updated', onTaskUpdated);
    socket.on('task:moved', onTaskMoved);
    socket.on('task:completed', onTaskCompleted);
    socket.on('task:deleted', onTaskDeleted);
    socket.on('list:created', onListCreated);
    socket.on('list:renamed', onListRenamed);
    socket.on('list:deleted', onListDeleted);
    socket.on('comment:added', onCommentAdded);

    return () => {
      socket.emit('board:leave', boardId);
      socket.off('task:created', onTaskCreated);
      socket.off('task:updated', onTaskUpdated);
      socket.off('task:moved', onTaskMoved);
      socket.off('task:completed', onTaskCompleted);
      socket.off('task:deleted', onTaskDeleted);
      socket.off('list:created', onListCreated);
      socket.off('list:renamed', onListRenamed);
      socket.off('list:deleted', onListDeleted);
      socket.off('comment:added', onCommentAdded);
    };
  }, [socket, boardId, dispatch]);
}