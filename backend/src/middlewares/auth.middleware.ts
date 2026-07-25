import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { ApiError } from '../utils/ApiError';

/**
 * Verifies the Bearer access token and attaches { id, email } to req.user.
 * Use on any route that requires a logged-in user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'NO_TOKEN_PROVIDED'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch (err) {
    next(new ApiError(401, 'INVALID_OR_EXPIRED_TOKEN'));
  }
}
