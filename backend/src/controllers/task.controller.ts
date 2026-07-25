import { Request, Response } from 'express';
import { pool } from '../config/db';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';
import { getIO } from '../sockets';

// POST /api/tasks
export const createTask = catchAsync(async (req: Request, res: Response) => {
  const { listId, boardId, title } = req.body;
  const userId = req.user!.id;

  if (!listId || !boardId || !title) {
    throw new ApiError(400, 'LIST_ID_BOARD_ID_TITLE_REQUIRED');
  }

  const result = await pool.query('SELECT * FROM md_create_task($1, $2, $3, $4)', [
    listId,
    boardId,
    title,
    userId,
  ]);

  const task = result.rows[0];

  getIO()
    .to(`board:${boardId}`)
    .emit('task:created', { listId, task });

  res.status(201).json({ success: true, data: task });
});

// PATCH /api/tasks/:id
export const updateTask = catchAsync(async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const { title, description, assignedTo, dueDate, priority } = req.body;
  const userId = req.user!.id;
  const boardId = req.resourceBoardId;

  if (!title) throw new ApiError(400, 'TITLE_REQUIRED');

  await pool.query('SELECT * FROM md_update_task($1, $2, $3, $4, $5, $6, $7)', [
    taskId,
    title,
    description ?? null,
    assignedTo ?? null,
    dueDate ?? null,
    priority ?? 'medium',
    userId,
  ]);

  const updated = { id: taskId, title, description, assignedTo, dueDate, priority };
  getIO().to(`board:${boardId}`).emit('task:updated', updated);

  res.status(200).json({ success: true, data: { message: 'Task updated' } });
});

// PATCH /api/tasks/:id/move
export const moveTask = catchAsync(async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const { newListId, newPosition } = req.body;
  const userId = req.user!.id;
  const boardId = req.resourceBoardId;

  if (!newListId || newPosition === undefined) {
    throw new ApiError(400, 'NEW_LIST_ID_AND_POSITION_REQUIRED');
  }

  await pool.query('SELECT * FROM md_move_task($1, $2, $3, $4)', [
    taskId,
    newListId,
    newPosition,
    userId,
  ]);

  getIO()
    .to(`board:${boardId}`)
    .emit('task:moved', { taskId, newListId, newPosition });

  res.status(200).json({ success: true, data: { message: 'Task moved' } });
});

// PATCH /api/tasks/:id/complete
export const toggleTaskComplete = catchAsync(async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const { isCompleted } = req.body;
  const userId = req.user!.id;
  const boardId = req.resourceBoardId;

  if (isCompleted === undefined) throw new ApiError(400, 'IS_COMPLETED_REQUIRED');

  await pool.query('SELECT * FROM md_toggle_task_complete($1, $2, $3)', [
    taskId,
    isCompleted,
    userId,
  ]);

  getIO().to(`board:${boardId}`).emit('task:completed', { taskId, isCompleted });

  res.status(200).json({ success: true, data: { message: 'Task status updated' } });
});

// DELETE /api/tasks/:id
export const deleteTask = catchAsync(async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const boardId = req.resourceBoardId;

  await pool.query('SELECT * FROM md_delete_task($1)', [taskId]);

  getIO().to(`board:${boardId}`).emit('task:deleted', { taskId });

  res.status(200).json({ success: true, data: { message: 'Task deleted' } });
});
