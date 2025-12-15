'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      console.log('=== CLIENT-SIDE CALLBACK PAGE ===');
      console.log('Window location:', window.location.href);
      console.log('Window location hash:', window.location.hash);
      console.log('Window location search:', window.location.search);
      
      // Check for hash fragments (OAuth implicit flow)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const hashAccessToken = hashParams.get('access_token');
      const hashCode = hashParams.get('code');
      const hashError = hashParams.get('error');
      const hashErrorDescription = hashParams.get('error_description');
      
      // Check for query parameters (OAuth authorization code flow)
      const code = searchParams.get('code');
      const access_token = searchParams.get('access_token');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const type = searchParams.get('type');

      console.log('Query params - code:', code);
      console.log('Query params - access_token:', access_token);
      console.log('Query params - error:', error);
      console.log('Query params - type:', type);
      console.log('Hash params - access_token:', hashAccessToken);
      console.log('Hash params - code:', hashCode);
      console.log('Hash params - error:', hashError);

      // Handle errors
      if (error || hashError) {
        const errorMsg = errorDescription || hashErrorDescription || error || hashError || 'Authentication failed';
        console.error('❌ OAuth error:', errorMsg);
        setStatus('error');
        setMessage(errorMsg);
        setTimeout(() => {
          router.push(`/login?error=${encodeURIComponent(errorMsg)}`);
        }, 2000);
        return;
      }

      const supabase = createClient();

      // Handle authorization code flow (preferred)
      // Supabase OAuth returns: ?code=... in query string
      // Expected format: /auth/callback?code=abc123&type=recovery (optional type param)
      const codeToUse = code || hashCode;
      if (codeToUse) {
        console.log('✅ Processing authorization code flow with code:', codeToUse.substring(0, 20) + '...');
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeToUse);
          
          if (exchangeError) {
            console.error('❌ Error exchanging code:', exchangeError);
            setStatus('error');
            setMessage(exchangeError.message || 'Failed to exchange code');
            setTimeout(() => {
              router.push(`/login?error=${encodeURIComponent(exchangeError.message || 'Authentication failed')}`);
            }, 2000);
            return;
          }

          if (data?.user) {
            console.log('✅ User authenticated:', data.user.id);
            
            // Create or update user profile for SSO users
            const email = data.user.email || '';
            
            // Try to get username from provider metadata (GitHub, Google, etc.)
            let username = email.split('@')[0]; // Default: extract from email
            
            const userMetadata = data.user.user_metadata || {};
            if (typeof userMetadata.user_name === 'string') {
              username = userMetadata.user_name;
              console.log('Using GitHub username:', username);
            } else if (typeof userMetadata.preferred_username === 'string') {
              username = userMetadata.preferred_username;
              console.log('Using preferred_username:', username);
            } else if (typeof userMetadata.full_name === 'string') {
              username = userMetadata.full_name.split(' ')[0].toLowerCase();
              console.log('Using full_name:', username);
            } else if (typeof userMetadata.name === 'string') {
              username = userMetadata.name.split(' ')[0].toLowerCase();
              console.log('Using name:', username);
            } else {
              console.log('Using default username from email:', username);
            }

            console.log('📝 Creating user profile for SSO user:', {
              id: data.user.id,
              email: email,
              username: username,
              provider: data.user.app_metadata?.provider,
            });

            // Create user profile
            try {
              const { error: profileError } = await supabase
                .from('users-profile')
                // @ts-expect-error - users-profile table type not defined in Supabase client
                .upsert({
                  id: data.user.id,
                  email: email,
                  username: username,
                  createdAt: new Date().toISOString(),
                }, {
                  onConflict: 'id',
                  ignoreDuplicates: false,
                });

              if (profileError) {
                console.error('❌ Error creating/updating user profile:', profileError);
                console.error('Profile error code:', profileError.code);
                console.error('Profile error message:', profileError.message);
                
                // If it's an RLS policy error, log helpful message
                if (profileError.code === '42501') {
                  console.error('⚠️ RLS Policy Error: Make sure you have RLS policies set up in Supabase.');
                  console.error('   Users need permission to INSERT/UPDATE their own profile.');
                  console.error('   See RLS_POLICIES.sql file for the SQL to run.');
                }
                
                // Continue even if profile creation fails - user is still authenticated
              } else {
                console.log('✅ User profile created/updated successfully');
              }
            } catch (profileError) {
              console.error('❌ Exception creating user profile:', profileError);
              // Continue even if profile creation fails
            }
            
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            
            // Redirect to dashboard
            setTimeout(() => {
              router.push('/dashboard');
            }, 1000);
          } else {
            console.warn('⚠️ No user in response');
            setStatus('error');
            setMessage('No user data received');
            setTimeout(() => {
              router.push('/login?error=No user data');
            }, 2000);
          }
        } catch (err) {
          console.error('❌ Exception during code exchange:', err);
          setStatus('error');
          setMessage(err instanceof Error ? err.message : 'Unknown error');
          setTimeout(() => {
            router.push('/login?error=Authentication failed');
          }, 2000);
        }
        return;
      }

      // Handle access_token in hash (implicit flow - less secure, but sometimes used)
      if (hashAccessToken) {
        console.log('⚠️ Access token found in hash (implicit flow)');
        console.warn('Implicit flow detected - this is less secure. Consider using authorization code flow.');
        
        try {
          // Set the session using the access token
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            console.error('❌ Error getting user:', userError);
            setStatus('error');
            setMessage('Failed to authenticate with access token');
            setTimeout(() => {
              router.push('/login?error=Token authentication failed');
            }, 2000);
            return;
          }

          console.log('✅ User authenticated via token:', user.id);
          
          // Create or update user profile for SSO users
          const email = user.email || '';
          let username = email.split('@')[0];
          
          const userMetadata = user.user_metadata || {};
          if (typeof userMetadata.user_name === 'string') {
            username = userMetadata.user_name;
          } else if (typeof userMetadata.preferred_username === 'string') {
            username = userMetadata.preferred_username;
          } else if (typeof userMetadata.full_name === 'string') {
            username = userMetadata.full_name.split(' ')[0].toLowerCase();
          } else if (typeof userMetadata.name === 'string') {
            username = userMetadata.name.split(' ')[0].toLowerCase();
          }

          // Create user profile
          try {
            const { error: profileError } = await supabase
              .from('users-profile')
              // @ts-expect-error - users-profile table type not defined in Supabase client
              .upsert({
                id: user.id,
                email: email,
                username: username,
                createdAt: new Date().toISOString(),
              }, {
                onConflict: 'id',
                ignoreDuplicates: false,
              });

            if (profileError) {
              console.error('❌ Error creating/updating user profile:', profileError);
              console.error('Profile error code:', profileError.code);
              console.error('Profile error message:', profileError.message);
              
              // If it's an RLS policy error, log helpful message
              if (profileError.code === '42501') {
                console.error('⚠️ RLS Policy Error: Make sure you have RLS policies set up in Supabase.');
                console.error('   Users need permission to INSERT/UPDATE their own profile.');
                console.error('   See RLS_POLICIES.sql file for the SQL to run.');
              }
            } else {
              console.log('✅ User profile created/updated successfully');
            }
          } catch (profileError) {
            console.error('❌ Exception creating user profile:', profileError);
            if (profileError && typeof profileError === 'object' && 'code' in profileError && profileError.code === '42501') {
              console.error('⚠️ RLS Policy Error: Make sure you have RLS policies set up in Supabase.');
            }
          }
          
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } catch (err) {
          console.error('❌ Exception during token auth:', err);
          setStatus('error');
          setMessage('Token authentication failed');
          setTimeout(() => {
            router.push('/login?error=Token authentication failed');
          }, 2000);
        }
        return;
      }

      // No code or token found - check if user is already authenticated via session
      console.warn('⚠️ No authentication code or token found in URL');
      console.log('Full URL:', window.location.href);
      console.log('Checking for existing session...');
      
      try {
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();
        
        if (user && !sessionError) {
          console.log('✅ User already authenticated via session:', user.id);
          setStatus('success');
          setMessage('Already authenticated! Redirecting...');
          
          // Create user profile if needed
          const email = user.email || '';
          let username = email.split('@')[0];
          
          const userMetadata = user.user_metadata || {};
          if (typeof userMetadata.user_name === 'string') {
            username = userMetadata.user_name;
          } else if (typeof userMetadata.preferred_username === 'string') {
            username = userMetadata.preferred_username;
          } else if (typeof userMetadata.full_name === 'string') {
            username = userMetadata.full_name.split(' ')[0].toLowerCase();
          } else if (typeof userMetadata.name === 'string') {
            username = userMetadata.name.split(' ')[0].toLowerCase();
          }

          // Create user profile
          try {
            await supabase
              .from('users-profile')
              // @ts-expect-error - users-profile table type not defined in Supabase client
              .upsert({
                id: user.id,
                email: email,
                username: username,
                createdAt: new Date().toISOString(),
              }, {
                onConflict: 'id',
                ignoreDuplicates: false,
              });
            console.log('✅ User profile checked/created');
          } catch (profileError) {
            console.error('❌ Error creating user profile:', profileError);
            if (profileError && typeof profileError === 'object' && 'code' in profileError) {
              console.error('Profile error code:', profileError.code);
              if (profileError.code === '42501') {
                console.error('⚠️ RLS Policy Error: Make sure you have RLS policies set up in Supabase.');
                console.error('   Users need permission to INSERT/UPDATE their own profile.');
                console.error('   See RLS_POLICIES.sql file for the SQL to run.');
              }
            }
          }
          
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
          return;
        } else {
          console.error('❌ No session found:', sessionError);
          setStatus('error');
          setMessage('No authentication parameters found. Please try again.');
          setTimeout(() => {
            router.push('/login?error=No authentication parameters');
          }, 2000);
        }
      } catch (err) {
        console.error('❌ Exception checking session:', err);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        setTimeout(() => {
          router.push('/login?error=Authentication failed');
        }, 2000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-lg font-semibold text-primary-foreground mb-2">
          {status === 'processing' && 'Processing authentication...'}
          {status === 'success' && '✅ Authentication successful!'}
          {status === 'error' && '❌ Authentication failed'}
        </div>
        <div className="text-sm text-secondary-foreground">
          {message}
        </div>
        {status === 'processing' && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
}

