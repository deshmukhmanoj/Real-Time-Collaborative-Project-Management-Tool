import { Request, Response } from 'express';
import { pool } from '../config/db';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';
import { getIO } from '../sockets';

// POST /api/comments
export const addComment = catchAsync(async (req: Request, res: Response) => {
  const { taskId, content } = req.body;
  const userId = req.user!.id;
  const boardId = req.resourceBoardId;

  if (!taskId || !content) throw new ApiError(400, 'TASK_ID_AND_CONTENT_REQUIRED');

  const result = await pool.query('SELECT * FROM md_add_comment($1, $2, $3)', [
    taskId,
    userId,
    content,
  ]);
  const comment = result.rows[0];

  getIO()
    .to(`board:${boardId}`)
    .emit('comment:added', { taskId, comment: { ...comment, userId, userName: req.user!.email } });

  res.status(201).json({ success: true, data: comment });
});

// GET /api/comments/task/:taskId
export const getTaskComments = catchAsync(async (req: Request, res: Response) => {
  const taskId = Number(req.params.taskId);

  const result = await pool.query('SELECT * FROM md_get_task_comments($1)', [taskId]);

  res.status(200).json({ success: true, data: result.rows });
});
