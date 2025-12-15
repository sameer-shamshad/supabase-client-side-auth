'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.error('Authentication error:', error);
        router.push('/login');
        return;
      }

      // Log user details to console
      console.log('Logged in user details:', {
        id: user.id,
        email: user.email,
        emailVerified: user.email_confirmed_at ? true : false,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at,
        metadata: user.user_metadata,
        appMetadata: user.app_metadata,
        fullUserObject: user,
      });

      setUser(user);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-primary-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold text-primary-foreground mb-4">
        Welcome to Dashboard!
      </h1>
      {user && (
        <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-primary-foreground mb-4">
            User Information
          </h2>
          <div className="space-y-2 text-sm text-secondary-foreground">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
          </div>
        </div>
      )}
    </div>
  );
}

