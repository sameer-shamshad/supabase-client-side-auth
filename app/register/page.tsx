'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import SSOButtons from '@/components/SSOButtons';
import { createClient } from '@/lib/supabase/client';
import registerMachine from '@/machines/RegisterMachine';
import { fetchProfileFromSupabase } from '@/store/features/AuthReducer';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [state, send] = useMachine(registerMachine);

  // Auto-hide resend success message after 5 seconds
  useEffect(() => {
    if (state.context.resendSuccess) {
      const timer = setTimeout(() => {
        send({ type: 'CLEAR_RESEND_SUCCESS' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.context.resendSuccess, send]);

  // If registration is successful and user has a session, fetch profile and redirect
  useEffect(() => {
    if (state.matches('success') && state.context.authResponse?.accessToken) {
      const fetchAndRedirect = async () => {
        try {
          // Check if user has a session (email might be auto-confirmed)
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) { // User has session, fetch profile and redirect
            await dispatch(fetchProfileFromSupabase());
            router.push('/dashboard');
          }
          // If no session, user needs to confirm email (already shown in UI)
        } catch (error) {
          console.error('Error checking session after registration:', error);
        }
      };
      
      fetchAndRedirect();
    }
  }, [state, router, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send({ type: 'SUBMIT' });
  };

  const handleChange = (field: 'username' | 'email' | 'password' | 'confirmPassword', value: string) => {
    send({ type: 'CHANGE_FIELD', field, value });
  };

  const isSubmitting = state.matches('submitting');
  const isSuccess = state.matches('success');

  return (
    <div className="flex flex-col items-center h-screen py-8 px-4 sm:px-0 sm:py-20">
      <form 
        onSubmit={handleSubmit} 
        className="w-full max-w-sm border border-border bg-background p-4 rounded-2xl flex flex-col gap-3 
        [&>div>label]:mb-1 [&>div>label]:block [&>div>label]:text-sm [&>div>label]:font-medium 
        [&>div>label]:text-primary-foreground [&>div>input]:w-full [&>div>input]:rounded-md 
        [&>div>input]:border [&>div>input]:border-border [&>div>input]:bg-background 
        [&>div>input]:text-primary-foreground [&>div>input]:px-3 [&>div>input]:py-2 
        [&>div>input]:focus:outline-none [&>div>input]:focus:ring-2 [&>div>input]:focus:ring-primary 
        [&>div>input]:disabled:cursor-not-allowed [&>div>input]:disabled:opacity-50"
      >
        <header className="text-3xl font-extrabold text-primary-foreground text-center">
          Sign Up
        </header>

        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={state.context.username}
            onChange={(e) => handleChange('username', e.target.value)}
            disabled={isSubmitting || isSuccess}
            placeholder="Enter your username"
          />
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={state.context.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={isSubmitting || isSuccess}
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={state.context.password}
            onChange={(e) => handleChange('password', e.target.value)}
            disabled={isSubmitting || isSuccess}
            placeholder="Enter your password (min 7 characters)"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={state.context.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            disabled={isSubmitting || isSuccess}
            placeholder="Confirm your password"
          />
        </div>

        {state.context.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <div className="mb-2">{state.context.error}</div>
            {state.context.error?.toLowerCase().includes('email') && state.context.error?.toLowerCase().includes('confirm') && (
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => send({ type: 'RESEND_EMAIL' })}
                  disabled={state.context.isResendingEmail || isSubmitting}
                  className="bg-primary text-secondary px-3 py-2 text-sm font-semibold rounded-md transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {state.context.isResendingEmail ? 'Sending...' : 'Resend Confirmation Email'}
                </button>
                {state.context.resendSuccess && (
                  <div className="rounded-md bg-green-50 p-2 text-xs text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Confirmation email sent! Please check your inbox.
                  </div>
                )}
                {state.context.resendError && (
                  <div className="rounded-md bg-red-50 p-2 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    {state.context.resendError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isSuccess && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <div className="mb-2">Registration successful! Please check your email to verify your account.</div>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => send({ type: 'RESEND_EMAIL' })}
                disabled={state.context.isResendingEmail || isSubmitting}
                className="bg-primary text-secondary px-3 py-2 text-sm font-semibold rounded-md transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state.context.isResendingEmail ? 'Sending...' : 'Resend Confirmation Email'}
              </button>
              {state.context.resendSuccess && (
                <div className="rounded-md bg-green-50 p-2 text-xs text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  Confirmation email sent! Please check your inbox.
                </div>
              )}
              {state.context.resendError && (
                <div className="rounded-md bg-red-50 p-2 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {state.context.resendError}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isSuccess}
          className="bg-primary text-secondary px-4 py-2 mt-5 font-semibold hover:opacity-90 cursor-pointer rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Creating account...' : isSuccess ? 'Success!' : 'Sign Up'}
        </button>
        <SSOButtons
          disabled={isSubmitting || isSuccess}
          label="or sign up with"
        />

        <p className="text-center text-sm text-secondary-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-primary hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

