'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { initializeAuth } from '@/store/features/AuthReducer';

/**
 * Higher Order Component (HOC) to protect routes that require authentication
 * 
 * This HOC relies on `initializeAuth` (called in App.tsx) which already:
 * - Checks Supabase session
 * - Fetches user profile if authenticated
 * - Loads from localStorage if fetch fails
 * 
 * The HOC simply checks Redux state and redirects if user is not authenticated.
 * 
 * Usage:
 * ```tsx
 * import withAuth from '@/components/withAuth';
 * 
 * function MyProtectedPage() {
 *   return <div>Protected Content</div>;
 * }
 * 
 * export default withAuth(MyProtectedPage);
 * ```
 * 
 * For layouts:
 * ```tsx
 * function MyProtectedLayout({ children }) {
 *   return <div>{children}</div>;
 * }
 * 
 * export default withAuth(MyProtectedLayout);
 * ```
 */
export default function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [isMounted, setIsMounted] = useState(false);
    const hasInitializedRef = useRef(false); // Track if we've already initialized
    const { user, isLoading } = useAppSelector((state) => state.auth);

    // Track if component is mounted (client-side only)
    useEffect(() => {
      setIsMounted(true);
    }, []);

    useEffect(() => {
      // Only check auth after component is mounted (client-side only)
      if (!isMounted) return;

      // Only initialize once, not every time user becomes null
      // This prevents re-initialization on logout
      if (!hasInitializedRef.current && !isLoading && !user) {
        hasInitializedRef.current = true;
        dispatch(initializeAuth()).then((result) => {
          const payload = result.payload as { isAuthenticated: boolean } | undefined;
          // If user is not authenticated after initialization, redirect to login
          if (result.meta.requestStatus === 'rejected' || 
              (payload && !payload.isAuthenticated)) {
            router.push('/login');
          }
        });
      } else if (hasInitializedRef.current && !isLoading && !user) {
        // If we've already initialized and user is null, redirect immediately
        // This handles logout case without re-initializing
        router.push('/login');
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMounted, isLoading, dispatch, router]); // Intentionally excluding 'user' to prevent infinite loops on logout

    // Always show loading state during SSR and initial client render to prevent hydration mismatch
    if (!isMounted || isLoading || !user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-primary-foreground">Loading...</div>
        </div>
      );
    }

    // User is authenticated, render the protected component
    return <Component {...props} />;
  };
}

