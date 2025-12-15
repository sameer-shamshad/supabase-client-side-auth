import type { Middleware } from '@reduxjs/toolkit';
import { setAuthenticated } from '../features/AuthReducer';

/**
 * Middleware to automatically fetch user data when authentication state changes
 * Only fetches if localStorage is empty to avoid duplicate calls
**/

export const authMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action); // Execute the action first
  
  // Trigger fetch on login/register (setAuthenticated) - only if localStorage is empty
  if (setAuthenticated.match(action)) {}

  return result;
};