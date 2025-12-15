import { createClient } from "@/lib/supabase/client";

export async function createOrUpdateUserProfile(userId: string, email: string, username?: string) {
  const supabase = createClient();

  // Extract username from email if not provided (for SSO users)
  const finalUsername = username || email.split('@')[0];

  const profileData = {
    id: userId,
    email: email,
    username: finalUsername,
    createdAt: new Date().toISOString(),
  };
  
  const { data, error } = await supabase
    .from('users-profile')
    .upsert(profileData, {
      onConflict: 'id',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    // Provide helpful error message for RLS policy errors
    if (error.code === '42501' || error.message?.includes('row-level security')) {
      console.error('⚠️ RLS Policy Error: Row-level security policy violation');
      console.error('   The users-profile table requires RLS policies to be set up.');
      console.error('   Please run the SQL in RLS_POLICIES.sql file in your Supabase SQL Editor.');
      throw new Error('RLS Policy Error: Permission denied. Please set up RLS policies for the users-profile table. See RLS_POLICIES.sql file.');
    }
    throw new Error(`Failed to create user profile: ${error.message}`);
  }

  return data;
}

export const fetchUserProfile = async () => {
  const supabase = createClient();
  
  // First check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  // Fetch profile from database
  const { data: profile, error: profileError } = await supabase
    .from('users-profile')
    .select('id, email, username, createdAt')
    .eq('id', user.id)
    .single();

  if (profileError) { // If profile doesn't exist, return null (not an error)
    if (profileError.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch user profile: ${profileError.message}`);
  }

  return profile;
};
