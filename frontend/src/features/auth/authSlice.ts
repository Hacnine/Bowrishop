import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types/types.index';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const stored = (() => {
  try {
    const raw = localStorage.getItem('trendora_auth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

const initialState: AuthState = {
  user: stored?.user ?? null,
  accessToken: stored?.accessToken ?? null,
  refreshToken: stored?.refreshToken ?? null,
  isAuthenticated: !!stored?.accessToken,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      localStorage.setItem('trendora_auth', JSON.stringify(action.payload));
    },
    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = !!state.user;
      if (state.user) {
        localStorage.setItem(
          'trendora_auth',
          JSON.stringify({ user: state.user, ...action.payload }),
        );
      }
    },
    updateUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      if (state.accessToken) {
        localStorage.setItem(
          'trendora_auth',
          JSON.stringify({ user: action.payload, accessToken: state.accessToken, refreshToken: state.refreshToken }),
        );
      }
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('trendora_auth');
    },
  },
});

export const { setCredentials, setTokens, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
