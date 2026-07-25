import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async controller so any thrown/rejected error
 * is forwarded to Express's error-handling middleware,
 * instead of needing try/catch in every controller.
 */
export const catchAsync = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
