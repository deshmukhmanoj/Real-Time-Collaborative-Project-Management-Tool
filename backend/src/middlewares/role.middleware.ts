import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';
import { ApiError } from '../utils/ApiError';
import { WorkspaceRole } from '../types';

/**
 * Checks the authenticated user's role inside a workspace by
 * calling the md_check_member_role() stored function.
 * Expects `workspaceId` to be present in req.params or req.body.
 *
 * Usage: router.post('/', authenticate, requireWorkspaceRole('admin'), controller)
 */
export function requireWorkspaceRole(minRole: WorkspaceRole) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const workspaceId = Number(req.params.workspaceId || req.body.workspaceId);
      const userId = req.user?.id;

      if (!workspaceId) {
        return next(new ApiError(400, 'WORKSPACE_ID_REQUIRED'));
      }
      if (!userId) {
        return next(new ApiError(401, 'NOT_AUTHENTICATED'));
      }

      await pool.query('SELECT * FROM md_check_member_role($1, $2, $3)', [
        workspaceId,
        userId,
        minRole,
      ]);

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Verifies the authenticated user belongs to the workspace that owns this board.
 * Reads boardId from req.params.id, req.params.boardId, or req.body.boardId (checked in that order).
 * Use on: GET/POST board routes, and anywhere a boardId is supplied directly (create list/task).
 */
export function requireBoardAccess() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const boardId = Number(req.params.id || req.params.boardId || req.body.boardId);
      const userId = req.user?.id;

      if (!boardId) return next(new ApiError(400, 'BOARD_ID_REQUIRED'));
      if (!userId) return next(new ApiError(401, 'NOT_AUTHENTICATED'));

      await pool.query('SELECT * FROM md_check_board_access($1, $2)', [boardId, userId]);
      req.resourceBoardId = boardId;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Resolves a list -> its board -> its workspace, then checks membership.
 * Reads listId from req.params.id or req.body.listId.
 * Use on: list reorder route.
 */
export function requireListAccess() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const listId = Number(req.params.id || req.body.listId);
      const userId = req.user?.id;

      if (!listId) return next(new ApiError(400, 'LIST_ID_REQUIRED'));
      if (!userId) return next(new ApiError(401, 'NOT_AUTHENTICATED'));

      const boardResult = await pool.query('SELECT * FROM md_get_board_id_by_list($1)', [
        listId,
      ]);
      const boardId = boardResult.rows[0].board_id;

      await pool.query('SELECT * FROM md_check_board_access($1, $2)', [boardId, userId]);
      req.resourceBoardId = boardId;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Resolves a task -> its board -> its workspace, then checks membership.
 * Reads taskId from req.params.id, req.params.taskId, or req.body.taskId.
 * Use on: task update/move/complete/delete, and comment/activity routes keyed by taskId.
 */
export function requireTaskAccess() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const taskId = Number(req.params.id || req.params.taskId || req.body.taskId);
      const userId = req.user?.id;

      if (!taskId) return next(new ApiError(400, 'TASK_ID_REQUIRED'));
      if (!userId) return next(new ApiError(401, 'NOT_AUTHENTICATED'));

      const boardResult = await pool.query('SELECT * FROM md_get_board_id_by_task($1)', [
        taskId,
      ]);
      const boardId = boardResult.rows[0].board_id;

      await pool.query('SELECT * FROM md_check_board_access($1, $2)', [boardId, userId]);
      req.resourceBoardId = boardId;
      next();
    } catch (err) {
      next(err);
    }
  };
}
