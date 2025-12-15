import type { User } from "@/types";
import { logout } from "@/services/auth.service";
import type { RootState, AppDispatch } from "../store";
import { createReducer, createAction, createAsyncThunk } from "@reduxjs/toolkit";

type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const getInitialContext = (): AuthState => { 
  // Get initial context from the supabase client.

  return {
    user: null,
    error: null,
    isLoading: false,
  };
};

const initialState: AuthState = getInitialContext();

// Async thunk for logout (invalidates refresh token on server)
export const logoutThunk = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>(
  'auth/logout',
  async (_, { getState }) => {
    const { auth } = getState();
    try {
      await logout();
    } catch (error) {

    }


    // Always clear local storage and tokens
    localStorage.clearItems();
  }
);

// Action creators
export const setAuthenticated = createAction<{ user: User; accessToken: string; refreshToken: string; }>('auth/SET_AUTHENTICATED');
export const setError = createAction<string>('auth/setError');
export const setLoading = createAction<boolean>('auth/setLoading');

const authReducer = createReducer(initialState, (builder) => {
  builder
    // Check session thunk
    .addCase(checkSessionThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(checkSessionThunk.fulfilled, (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        state.accessToken = accessToken;
      }

      // Prioritize refreshToken from user object (from backend), then from payload
      const refreshTokenValue = user?.refreshToken || refreshToken;
      
      // Always store refreshToken in localStorage if available (so it's accessible even if accessToken expires)
      if (refreshTokenValue) {
        localStorage.setItem('refreshToken', refreshTokenValue);
      }

      state.user = user;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    })
    .addCase(checkSessionThunk.rejected, (state, action) => {
      // Clear tokens on session check failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload || 'Session check failed';
    })
    // SET_AUTHENTICATED - matches AuthMachine SET_AUTHENTICATED event
    .addCase(setAuthenticated, (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      
      localStorage.setItem('accessToken', accessToken);
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      state.user = { ...user, refreshToken };
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    })
    // Logout thunk
    .addCase(logoutThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(logoutThunk.fulfilled, (state) => {
      // Local storage already cleared in thunk
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    })
    .addCase(logoutThunk.rejected, (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    })
    .addCase(setError, (state, action) => {
      state.error = action.payload;
    })
    .addCase(setLoading, (state, action) => {
      state.isLoading = action.payload;
    });
});

export default authReducer;