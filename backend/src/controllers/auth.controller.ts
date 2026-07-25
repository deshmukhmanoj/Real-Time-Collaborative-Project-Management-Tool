import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../config/db';
import { env } from '../config/env';
import { catchAsync } from '../utils/catchAsync';
import { ApiError } from '../utils/ApiError';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiryDate,
} from '../utils/jwt.util';

// POST /api/auth/register
export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'NAME_EMAIL_PASSWORD_REQUIRED');
  }
  if (password.length < 6) {
    throw new ApiError(400, 'PASSWORD_TOO_SHORT');
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  const result = await pool.query('SELECT * FROM md_register_user($1, $2, $3)', [
    name,
    email,
    passwordHash,
  ]);

  const user = result.rows[0];

  res.status(201).json({
    success: true,
    data: { id: user.id, name: user.name, email: user.email },
  });
});

// POST /api/auth/login
export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'EMAIL_PASSWORD_REQUIRED');
  }

  let user;
  try {
    const result = await pool.query('SELECT * FROM md_get_user_by_email($1)', [email]);
    user = result.rows[0];
  } catch (err: any) {
    // Don't leak whether the email exists — surface the same error as a wrong password
    if (err?.message?.includes('USER_NOT_FOUND')) {
      throw new ApiError(401, 'INVALID_CREDENTIALS');
    }
    throw err;
  }

  if (!user.is_active) {
    throw new ApiError(403, 'ACCOUNT_DISABLED');
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new ApiError(401, 'INVALID_CREDENTIALS');
  }

  const payload = { userId: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await pool.query('SELECT * FROM md_store_refresh_token($1, $2, $3)', [
    user.id,
    refreshToken,
    getRefreshTokenExpiryDate(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    },
  });
});

// POST /api/auth/refresh-token
export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new ApiError(400, 'REFRESH_TOKEN_REQUIRED');
  }

  // Verifies JWT signature/expiry AND checks it's still valid in DB (not revoked)
  const decoded = verifyRefreshToken(token);
  await pool.query('SELECT * FROM md_validate_refresh_token($1)', [token]);

  const newAccessToken = signAccessToken({ userId: decoded.userId, email: decoded.email });

  res.status(200).json({
    success: true,
    data: { accessToken: newAccessToken },
  });
});

// POST /api/auth/logout
export const logout = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new ApiError(400, 'REFRESH_TOKEN_REQUIRED');
  }

  await pool.query('SELECT * FROM md_revoke_refresh_token($1)', [token]);

  res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
});
