'use client';
import { useEffect, useRef } from 'react';
import { useMachine } from '@xstate/react';
import { useRouter } from 'next/navigation';
import loginMachine from '@/machines/LoginMachine';

interface SSOButtonsProps {
  label?: string;
  disabled?: boolean;
}

export default function SSOButtons({ label = 'or sign in with', disabled = false }: SSOButtonsProps) {
  const router = useRouter();
  const [state, send] = useMachine(loginMachine);
  const isSSOInitiatedRef = useRef(false);

  // Redirect to dashboard on successful SSO sign-in (only for SSO, not email login)
  useEffect(() => {
    // Check if we're currently in an SSO state to track initiation
    const isInSSOState = state.matches('signingInWithGoogle') || 
      state.matches('signingInWithGithub') || 
      state.matches('signingInWithFacebook');
    
    if (isInSSOState) {
      isSSOInitiatedRef.current = true;
    }
    
    // Redirect on success if SSO was initiated
    const isSSOSuccess = state.matches('success') && 
      state.context.authResponse && 
      isSSOInitiatedRef.current;
    
    if (isSSOSuccess) {
      console.log('SSO sign-in successful, redirecting to dashboard...', {
        state: state.value,
        hasAuthResponse: !!state.context.authResponse,
        isSSOInitiated: isSSOInitiatedRef.current
      });

      // Redirect immediately - don't wait
      router.push('/dashboard');
      isSSOInitiatedRef.current = false; // Reset flag after redirect
    }
  }, [state, router]);
  
  // Debug: Log state changes for SSO
  useEffect(() => {
    if (state.matches('signingInWithGithub') || state.matches('signingInWithGoogle') || state.matches('signingInWithFacebook')) {
      console.log('SSO sign-in in progress:', state.value);
    }
    if (state.matches('success')) {
      console.log('Login machine reached success state:', {
        hasAuthResponse: !!state.context.authResponse,
        isSSOInitiated: isSSOInitiatedRef.current,
        error: state.context.error
      });
    }
    if (state.context.error) {
      console.error('SSO error:', state.context.error);
    }
  }, [state]);

  const isSSOLoading = state.matches('signingInWithGoogle') || 
    state.matches('signingInWithGithub') || 
    state.matches('signingInWithFacebook');

  return (
    <div>
      <p className="mb-4 text-center text-sm text-secondary-foreground">
        {label}
      </p>
      {state.context.error && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {state.context.error}
        </div>
      )}
      <div 
        className="flex justify-center gap-6 [&>button]:text-white [&>button]:bg-primary 
        [&>button]:rounded-full [&>button]:px-2 [&>button]:py-1 [&>button]:border [&>button]:border-border 
        [&>button]:transition-colors [&>button]:hover:opacity-80 [&>button]:focus:opacity-90 
        [&>button]:disabled:cursor-not-allowed [&>button]:disabled:opacity-50"
      >
        <button 
          type="button" 
          className="bi bi-google" 
          aria-label="Sign in with Google"
          onClick={() => {
            isSSOInitiatedRef.current = true;
            send({ type: 'SIGN_IN_WITH_GOOGLE' });
          }}
          disabled={disabled || isSSOLoading}
        />
        <button 
          type="button" 
          className="bi bi-github" 
          aria-label="Sign in with GitHub"
          onClick={() => {
            isSSOInitiatedRef.current = true;
            send({ type: 'SIGN_IN_WITH_GITHUB' });
          }}
          disabled={disabled || isSSOLoading}
        />
        <button 
          type="button" 
          className="bi bi-facebook" 
          aria-label="Sign in with Facebook"
          onClick={() => {
            isSSOInitiatedRef.current = true;
            send({ type: 'SIGN_IN_WITH_FACEBOOK' });
          }}
          disabled={disabled || isSSOLoading}
        />
      </div>
    </div>
  );
}

