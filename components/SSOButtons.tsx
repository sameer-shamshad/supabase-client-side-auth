'use client';
import { useState } from 'react';
import { signInWithGoogle, signInWithGithub, signInWithFacebook } from '@/services/auth.service';

interface SSOButtonsProps {
  label?: string;
  disabled?: boolean;
}

export default function SSOButtons({ label = 'or sign in with', disabled = false }: SSOButtonsProps) {
  const [isLoading, setIsLoading] = useState<'google' | 'github' | 'facebook' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSSO = async (provider: 'google' | 'github' | 'facebook') => {
    setIsLoading(provider);
    setError(null);

    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else if (provider === 'github') {
        await signInWithGithub();
      } else if (provider === 'facebook') {
        await signInWithFacebook();
      }
      // Note: The redirect happens in the service function, so we won't reach here
      // The user will be redirected to the OAuth provider, then back to /auth/callback
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate sign-in');
      setIsLoading(null);
    }
  };

  const isSSOLoading = isLoading !== null;

  return (
    <div>
      <p className="mb-4 text-center text-sm text-secondary-foreground">
        {label}
      </p>
      {error && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
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
          onClick={() => handleSSO('google')}
          disabled={disabled || isSSOLoading}
        />
        <button 
          type="button" 
          className="bi bi-github" 
          aria-label="Sign in with GitHub"
          onClick={() => handleSSO('github')}
          disabled={disabled || isSSOLoading}
        />
        <button 
          type="button" 
          className="bi bi-facebook" 
          aria-label="Sign in with Facebook"
          onClick={() => handleSSO('facebook')}
          disabled={disabled || isSSOLoading}
        />
      </div>
    </div>
  );
}

