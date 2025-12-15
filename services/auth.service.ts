import { createClient } from "@/lib/supabase/client";
import { createOrUpdateUserProfile } from "./user.service";

export const loginWithEmailAndPassword = async (email: string, password: string) => {
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  if (!trimmedEmail) {
    throw new Error('Email is required');
  }

  if (trimmedPassword.length <= 6) {
    throw new Error('Password is required and must be at least 7 characters long.');
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password: trimmedPassword,
  });

  if(error && (
    error.message?.includes('Email not confirmed') || 
    error.message?.includes('email_not_confirmed') ||
    error.status === 400 && error.message?.toLowerCase().includes('email')
  )) {
    throw new Error('Please confirm your email address before signing in. Check your inbox for the confirmation link.');
  }

  if (data.user) await createOrUpdateUserProfile(data.user.id, data.user.email || trimmedEmail);

  return { accessToken: data.session.access_token };
};

/**
 * Register with email and password
**/
export const registerWithEmailAndPassword = async (username: string, email: string, password: string) => {
  // Validation
  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  if (!trimmedUsername) {
    throw new Error('Username is required');
  }

  if (!trimmedEmail) {
    throw new Error('Email is required');
  }

  if (!trimmedPassword) {
    throw new Error('Password is required');
  }

  if (trimmedPassword.length <= 6) {
    throw new Error('Password must be at least 7 characters long');
  }

  const supabase = createClient();
  // Include username in redirect URL as fallback in case user_metadata is not preserved
  const redirectUrl = `${window.location.origin}/auth/callback?username=${encodeURIComponent(trimmedUsername)}`;

  // Sign up the user
  const { data, error } = await supabase.auth.signUp({ 
    email: trimmedEmail, 
    password: trimmedPassword,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        username: trimmedUsername,
      }
    }
  });

  if (error) throw new Error(error.message);

  // Profile creation is handled in the callback route after email confirmation
  // If email confirmation is disabled (auto-confirm), the callback route will still handle it
  // when the user is redirected after signup

  return { accessToken: data.session?.access_token || '' };
};

/**
 * Resend email confirmation
 */
export const resendConfirmationEmail = async (email: string) => {
  const supabase = createClient();
  
  const redirectUrl = `${window.location.origin}/auth/callback`;
  
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: redirectUrl,
    }
  });

  if (error) {
    console.error('Resend confirmation email error:', error);
    throw new Error(error.message || 'Failed to resend confirmation email');
  }

  console.log('Confirmation email resent successfully:', data);
  return { success: true };
};

export const signInWithGoogle = async () => {
  const supabase = createClient();
  const redirectUrl = `${window.location.origin}/auth/callback`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  // Redirect to OAuth provider
  if (data.url) {
    window.location.href = data.url;
  }

  // Return empty token as redirect happens
  return { accessToken: '' };
};

export const signInWithGithub = async () => {
  const supabase = createClient();
  const redirectUrl = `${window.location.origin}/auth/callback`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  // Redirect to OAuth provider
  if (data.url) {
    window.location.href = data.url;
  }

  // Return empty token as redirect happens
  return { accessToken: '' };
};

export const signInWithFacebook = async () => {
  const supabase = createClient();
  const redirectUrl = `${window.location.origin}/auth/callback`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  // Redirect to OAuth provider
  if (data.url) {
    window.location.href = data.url;
  }

  // Return empty token as redirect happens
  return {
    accessToken: '',
  };
};

export const logout = async () => {
  const supabase = createClient();
  
  const { error } = await supabase.auth.signOut();

  if (error) throw new Error(error.message);
};
