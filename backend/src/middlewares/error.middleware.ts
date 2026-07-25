import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

// Maps RAISE EXCEPTION messages thrown inside md_* stored procedures
// to proper HTTP status codes.
const DB_ERROR_MAP: Record<string, number> = {
  EMAIL_ALREADY_EXISTS: 409,
  USER_NOT_FOUND: 404,
  INVALID_OR_EXPIRED_TOKEN: 401,
  NOT_A_MEMBER: 403,
  INSUFFICIENT_PERMISSIONS: 403,
  ALREADY_A_MEMBER: 409,
  WORKSPACE_NOT_FOUND: 404,
  BOARD_NOT_FOUND: 404,
  LIST_NOT_FOUND: 404,
  TASK_NOT_FOUND: 404,
  LIST_BOARD_MISMATCH: 400,
};

function extractPgExceptionCode(message: string): string | null {
  // node-postgres surfaces RAISE EXCEPTION 'CODE' as the error message itself
  for (const code of Object.keys(DB_ERROR_MAP)) {
    if (message.includes(code)) return code;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  // 1) Known application errors (thrown deliberately via ApiError)
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // 2) Raw jsonwebtoken errors (e.g. thrown directly by jwt.verify in a controller
  //    that didn't wrap it, such as an expired/malformed refresh token)
  if (err?.name === 'TokenExpiredError' || err?.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'INVALID_OR_EXPIRED_TOKEN',
    });
    return;
  }

  // 3) PostgreSQL RAISE EXCEPTION messages bubbled up from stored procedures
  const pgMessage: string = err?.message || '';
  const pgCode = extractPgExceptionCode(pgMessage);
  if (pgCode) {
    res.status(DB_ERROR_MAP[pgCode]).json({
      success: false,
      error: pgCode,
    });
    return;
  }

  // 4) Unknown / unexpected errors
  // eslint-disable-next-line no-console
  console.error('UNHANDLED ERROR:', err);

  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    ...(env.NODE_ENV === 'development' ? { detail: pgMessage || String(err) } : {}),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, error: 'ROUTE_NOT_FOUND' });
}
