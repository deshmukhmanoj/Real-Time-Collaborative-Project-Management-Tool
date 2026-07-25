import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '@/types';

const storedUser = localStorage.getItem('md_user');
const storedAccessToken = localStorage.getItem('md_access_token');
const storedRefreshToken = localStorage.getItem('md_refresh_token');

const initialState: AuthState = {
  user: storedUser ? (JSON.parse(storedUser) as User) : null,
  accessToken: storedAccessToken,
  refreshToken: storedRefreshToken,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;

      localStorage.setItem('md_user', JSON.stringify(action.payload.user));
      localStorage.setItem('md_access_token', action.payload.accessToken);
      localStorage.setItem('md_refresh_token', action.payload.refreshToken);
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      localStorage.setItem('md_access_token', action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;

      localStorage.removeItem('md_user');
      localStorage.removeItem('md_access_token');
      localStorage.removeItem('md_refresh_token');
    },
  },
});

export const { setCredentials, setAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;
