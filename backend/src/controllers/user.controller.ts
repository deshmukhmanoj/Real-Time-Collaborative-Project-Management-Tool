import { Request, Response } from 'express';
import { pool } from '../config/db';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';

// GET /api/users/lookup?email=someone@example.com
export const lookupUserByEmail = catchAsync(async (req: Request, res: Response) => {
  const email = req.query.email as string;

  if (!email) throw new ApiError(400, 'EMAIL_QUERY_PARAM_REQUIRED');

  const result = await pool.query('SELECT * FROM md_find_user_public($1)', [email]);

  res.status(200).json({ success: true, data: result.rows[0] });
});
