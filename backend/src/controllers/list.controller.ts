import { Request, Response } from 'express';
import { pool } from '../config/db';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';
import { getIO } from '../sockets';

// POST /api/lists
export const createList = catchAsync(async (req: Request, res: Response) => {
  const { boardId, title } = req.body;

  if (!boardId || !title) throw new ApiError(400, 'BOARD_ID_AND_TITLE_REQUIRED');

  const result = await pool.query('SELECT * FROM md_create_list($1, $2)', [boardId, title]);
  const list = result.rows[0];

  getIO().to(`board:${boardId}`).emit('list:created', list);

  res.status(201).json({ success: true, data: list });
});

// PATCH /api/lists/:id/reorder
export const reorderList = catchAsync(async (req: Request, res: Response) => {
  const listId = Number(req.params.id);
  const { position } = req.body;
  const boardId = req.resourceBoardId;

  if (position === undefined) throw new ApiError(400, 'POSITION_REQUIRED');

  await pool.query('SELECT * FROM md_reorder_list($1, $2)', [listId, position]);

  getIO().to(`board:${boardId}`).emit('list:reordered', { listId, position });

  res.status(200).json({ success: true, data: { message: 'List reordered' } });
});

// PATCH /api/lists/:id
export const renameList = catchAsync(async (req: Request, res: Response) => {
  const listId = Number(req.params.id);
  const { title } = req.body;
  const boardId = req.resourceBoardId;

  if (!title || !title.trim()) throw new ApiError(400, 'TITLE_REQUIRED');

  const result = await pool.query('SELECT * FROM md_rename_list($1, $2)', [listId, title.trim()]);
  const list = result.rows[0];

  getIO().to(`board:${boardId}`).emit('list:renamed', { listId, title: list.title });

  res.status(200).json({ success: true, data: list });
});

// DELETE /api/lists/:id
export const deleteList = catchAsync(async (req: Request, res: Response) => {
  const listId = Number(req.params.id);
  const boardId = req.resourceBoardId;

  await pool.query('SELECT * FROM md_delete_list($1)', [listId]);

  getIO().to(`board:${boardId}`).emit('list:deleted', { listId });

  res.status(200).json({ success: true, data: { message: 'List deleted' } });
});