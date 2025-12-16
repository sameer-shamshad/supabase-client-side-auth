import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const usernameFromUrl = requestUrl.searchParams.get('username'); // Fallback: username from URL
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/login?error=Authentication failed', requestUrl.origin));
    }

    if (data.user) { // Create or update user profile
      const email = data.user.email || '';
      
      // Try to get username from provider metadata (GitHub, Google, etc.) or user_metadata
      let username = email.split('@')[0]; // Default: extract from email
      
      const userMetadata = data.user.user_metadata || {};
      const rawUserMetaData = (data.user as { raw_user_meta_data?: Record<string, unknown> }).raw_user_meta_data || {};
      
      // Priority order for username:
      // 1. URL parameter (fallback for email/password registration)
      // 2. user_metadata.username (from email/password registration)
      // 3. raw_user_meta_data.username
      // 4. Other metadata fields (SSO providers)
      if (usernameFromUrl && usernameFromUrl.trim().length > 0) {
        username = decodeURIComponent(usernameFromUrl).trim();
      } else if (typeof userMetadata.username === 'string' && userMetadata.username.trim().length > 0) {
        username = userMetadata.username.trim();
      } else if (typeof rawUserMetaData.username === 'string' && rawUserMetaData.username.trim().length > 0) {
        username = rawUserMetaData.username.trim();
      } else if (typeof userMetadata.user_name === 'string' && userMetadata.user_name.trim().length > 0) {
        username = userMetadata.user_name.trim();
      } else if (typeof userMetadata.preferred_username === 'string' && userMetadata.preferred_username.trim().length > 0) {
        username = userMetadata.preferred_username.trim();
      } else if (typeof userMetadata.full_name === 'string' && userMetadata.full_name.trim().length > 0) {
        username = userMetadata.full_name.split(' ')[0].toLowerCase().trim();
      } else if (typeof userMetadata.name === 'string' && userMetadata.name.trim().length > 0) {
        username = userMetadata.name.split(' ')[0].toLowerCase().trim();
      }

      // Create or update user profile
      // Note: This is a server-side route, so retry logic isn't necessary
      // If user reached this callback, internet connection is already established
      // If Supabase is down, retrying won't help - profile can be created later
      try {
        const { error: profileError } = await supabase
          .from('users-profile')
          .upsert({
            id: data.user.id,
            email: email,
            username: username,
            createdAt: new Date().toISOString(),
          }, {
            onConflict: 'id',
          });
        
        // Silently handle error - profile can be created later
        // Continue even if profile creation fails (don't block auth flow)
        if (profileError) {
          // Error logged but not thrown - auth flow continues
        }
      } catch {
        // Silently handle error - profile can be created later
        // Continue even if profile creation fails (don't block auth flow)
      }
    }

    // Redirect to dashboard or next URL
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // If no code, redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}

