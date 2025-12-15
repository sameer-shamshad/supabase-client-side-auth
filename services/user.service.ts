import { createClient } from "@/lib/supabase/client";

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
