import { Request, Response } from 'express';
import { pool } from '../config/db';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

// POST /api/workspaces
export const createWorkspace = catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body;
  const userId = req.user!.id;

  if (!name) throw new ApiError(400, 'WORKSPACE_NAME_REQUIRED');

  const result = await pool.query('SELECT * FROM md_create_workspace($1, $2)', [name, userId]);

  res.status(201).json({ success: true, data: result.rows[0] });
});

// GET /api/workspaces
export const getMyWorkspaces = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await pool.query('SELECT * FROM md_get_user_workspaces($1)', [userId]);

  res.status(200).json({ success: true, data: result.rows });
});

// POST /api/workspaces/:workspaceId/members
export const addWorkspaceMember = catchAsync(async (req: Request, res: Response) => {
  const workspaceId = Number(req.params.workspaceId);
  const { userId, role } = req.body;

  if (!userId || !role) throw new ApiError(400, 'USER_ID_AND_ROLE_REQUIRED');

  const result = await pool.query('SELECT * FROM md_add_workspace_member($1, $2, $3)', [
    workspaceId,
    userId,
    role,
  ]);

  res.status(201).json({ success: true, data: result.rows[0] });
});

// GET /api/workspaces/:workspaceId/members
export const getWorkspaceMembers = catchAsync(async (req: Request, res: Response) => {
  const workspaceId = Number(req.params.workspaceId);

  const result = await pool.query('SELECT * FROM md_get_workspace_members($1)', [workspaceId]);

  res.status(200).json({ success: true, data: result.rows });
});
