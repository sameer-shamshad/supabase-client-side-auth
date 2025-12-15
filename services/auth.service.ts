import { createClient } from "@/lib/supabase/client";

/**
 * Helper function to create user profile in users-profile table
 * Only creates if profile doesn't exist (does not update existing profiles)
**/
async function createOrUpdateUserProfile(userId: string, email: string, username?: string) {
  const supabase = createClient();

  // Extract username from email if not provided (for SSO users)
  const finalUsername = username || email.split('@')[0];

  // First, check if profile already exists
  const { data: existingProfile, error: checkError } = await supabase
    .from('users-profile')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (checkError) {
    throw new Error(`Failed to check for existing profile: ${checkError.message}`);
  }

  // If profile already exists, return it without updating
  if (existingProfile) return existingProfile;

  // Profile doesn't exist, create it
  const profileData = {
    id: userId,
    email: email,
    username: finalUsername,
    createdAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('users-profile')
    .insert(profileData)
    .select()
    .single();

  if (error) { // Provide helpful error messages for common issues
    if (error.code === '42501') {
      throw new Error(`RLS Policy Error: Permission denied. Check your Supabase RLS policies for the users-profile table.`);
    } else if (error.code === '23505') { // Unique constraint violation (shouldn't happen since we checked, but just in case)
      return existingProfile || { id: userId };
    } else {
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
  }

  return data;
}

export const loginWithEmailAndPassword = async (email: string, password: string) => {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password,
  });

  if(error && (
    error.message?.includes('Email not confirmed') || 
    error.message?.includes('email_not_confirmed') ||
    error.status === 400 && error.message?.toLowerCase().includes('email')
  )) {
    throw new Error('Please confirm your email address before signing in. Check your inbox for the confirmation link.');
  }

  if (data.user) await createOrUpdateUserProfile(data.user.id, data.user.email || email);

  return { accessToken: data.session.access_token };
};

/**
 * Register with email and password
**/
export const registerWithEmailAndPassword = async (username: string, email: string, password: string) => {
  const supabase = createClient();
  const redirectUrl = `${window.location.origin}/dashboard`;

  // Sign up the user
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        username: username,
      }
    }
  });

  if (error) throw new Error(error.message);

  if (data.user) { // Create user profile
    try {
      await createOrUpdateUserProfile(data.user.id, email, username);
    } catch (profileError) {
      throw new Error(`Failed to create user profile: ${profileError}`);
    }
  }

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
