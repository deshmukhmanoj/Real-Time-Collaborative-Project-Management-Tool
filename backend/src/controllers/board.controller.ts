import { Request, Response } from 'express';
import { pool } from '../config/db';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

// POST /api/boards
export const createBoard = catchAsync(async (req: Request, res: Response) => {
  const { workspaceId, title } = req.body;
  const userId = req.user!.id;

  if (!workspaceId || !title) throw new ApiError(400, 'WORKSPACE_ID_AND_TITLE_REQUIRED');

  const result = await pool.query('SELECT * FROM md_create_board($1, $2, $3)', [
    workspaceId,
    title,
    userId,
  ]);

  res.status(201).json({ success: true, data: result.rows[0] });
});

// GET /api/boards/workspace/:workspaceId
export const getWorkspaceBoards = catchAsync(async (req: Request, res: Response) => {
  const workspaceId = Number(req.params.workspaceId);

  const result = await pool.query('SELECT * FROM md_get_workspace_boards($1)', [workspaceId]);

  res.status(200).json({ success: true, data: result.rows });
});

// GET /api/boards/:id/full  -> nested board+lists+tasks JSON
export const getBoardFull = catchAsync(async (req: Request, res: Response) => {
  const boardId = Number(req.params.id);

  const result = await pool.query('SELECT md_get_board_full($1) AS board', [boardId]);

  res.status(200).json({ success: true, data: result.rows[0].board });
});
