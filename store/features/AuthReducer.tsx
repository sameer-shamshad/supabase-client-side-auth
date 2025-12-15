import type { User } from "@/types";
import { logout } from "@/services/auth.service";
import { fetchUserProfile } from "@/services/user.service";
import { createClient } from "@/lib/supabase/client";
import type { RootState, AppDispatch } from "../store";
import { createReducer, createAction, createAsyncThunk } from "@reduxjs/toolkit";

type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const USER_STORAGE_KEY = 'user_profile';

// Helper to save user to localStorage
const saveUserToStorage = (user: User | null) => {
  if (user)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  else
    localStorage.removeItem(USER_STORAGE_KEY);
};

// Helper to load user from localStorage
const loadUserFromStorage = (): User | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as User;
    }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  return null;
};

const getInitialContext = (): AuthState => {
  // Load user from localStorage on initialization
  const user = loadUserFromStorage();
  
  return {
    user: user,
    error: null,
    isLoading: false,
  };
};

const initialState: AuthState = getInitialContext();

// Thunk to fetch user from Supabase (used on login)
export const fetchProfileFromSupabase = createAsyncThunk<
  User | null,
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>(
  'auth/fetchProfileFromSupabase',
  async (_, { rejectWithValue }) => {
    try {
      const user = await fetchUserProfile();
      
      // Save to localStorage if user exists
      if (user) {
        saveUserToStorage(user);
      } else {
        // Clear localStorage if no user found
        saveUserToStorage(null);
      }
      
      return user;
    } catch (error) {
      // If user is not authenticated, clear user
      saveUserToStorage(null);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch user');
    }
  }
);

// Thunk to initialize auth state (check session and load from localStorage)
export const initializeAuth = createAsyncThunk<
  { user: User | null; isAuthenticated: boolean },
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const supabase = createClient();
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error || !authUser) {
        // User not authenticated, clear user
        saveUserToStorage(null);
        return { user: null, isAuthenticated: false };
      }
      
      // User is authenticated, try to fetch fresh user from Supabase
      try {
        const user = await fetchUserProfile();
        if (user) {
          saveUserToStorage(user);
          return { user, isAuthenticated: true };
        }
      } catch {
        // If fetch fails, try to load from localStorage
        const cachedUser = loadUserFromStorage();
        if (cachedUser) {
          return { user: cachedUser, isAuthenticated: true };
        }
      }
      
      // No user found, clear state
      saveUserToStorage(null);
      return { user: null, isAuthenticated: false };
    } catch (error) {
      saveUserToStorage(null);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to initialize auth');
    }
  }
);

// Async thunk for logout
export const logoutThunk = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('auth/logout', async () => {
    try {
      await logout();
    } catch (error) { // Continue with logout even if server logout fails
      console.error('Logout error:', error);
    }
    
    // Always clear local storage
    saveUserToStorage(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
);

// Action creators
export const setUser = createAction<User | null>('auth/setUser');
export const setError = createAction<string>('auth/setError');
export const setLoading = createAction<boolean>('auth/setLoading');
export const clearAuth = createAction('auth/clearAuth');

const authReducer = createReducer(initialState, (builder) => {
  builder
    // Initialize auth
    .addCase(initializeAuth.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(initializeAuth.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.isLoading = false;
      state.error = null;
    })
    .addCase(initializeAuth.rejected, (state, action) => {
      state.user = null;
      state.isLoading = false;
      state.error = action.payload || 'Failed to initialize auth';
      saveUserToStorage(null);
    })
    // Fetch user from Supabase
    .addCase(fetchProfileFromSupabase.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(fetchProfileFromSupabase.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isLoading = false;
      state.error = null;
    })
    .addCase(fetchProfileFromSupabase.rejected, (state, action) => {
      // Clear user if fetch fails (user not authenticated)
      state.user = null;
      state.isLoading = false;
      state.error = action.payload || 'Failed to fetch user';
      saveUserToStorage(null);
    })
    // Logout thunk
    .addCase(logoutThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(logoutThunk.fulfilled, (state) => {
      state.user = null;
      state.isLoading = false;
      state.error = null;
    })
    .addCase(logoutThunk.rejected, (state) => {
      state.user = null;
      state.isLoading = false;
      state.error = null;
    })
    // Set user action
    .addCase(setUser, (state, action) => {
      state.user = action.payload;
      saveUserToStorage(action.payload);
    })
    // Clear auth action
    .addCase(clearAuth, (state) => {
      state.user = null;
      saveUserToStorage(null);
    })
    .addCase(setError, (state, action) => {
      state.error = action.payload;
    })
    .addCase(setLoading, (state, action) => {
      state.isLoading = action.payload;
    });
});

export default authReducer;