import { Request, Response } from 'express';
import { pool } from '../config/db';
import { catchAsync } from '../utils/catchAsync';

// GET /api/activity/task/:taskId
export const getTaskActivity = catchAsync(async (req: Request, res: Response) => {
  const taskId = Number(req.params.taskId);

  const result = await pool.query('SELECT * FROM md_get_task_activity($1)', [taskId]);

  res.status(200).json({ success: true, data: result.rows });
});

// GET /api/activity/board/:boardId
export const getBoardActivity = catchAsync(async (req: Request, res: Response) => {
  const boardId = Number(req.params.boardId);
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  const result = await pool.query('SELECT * FROM md_get_board_activity($1, $2)', [
    boardId,
    limit,
  ]);

  res.status(200).json({ success: true, data: result.rows });
});
