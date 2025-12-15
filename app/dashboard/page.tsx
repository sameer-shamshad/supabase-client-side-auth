"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutThunk, fetchProfileFromSupabase } from "@/store/features/AuthReducer";

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !authUser) {
        router.push("/login");
        return;
      }

      // If no user in Redux, fetch it
      if (!user) {
        dispatch(fetchProfileFromSupabase());
      }
    };

    checkAuth();
  }, [router, dispatch, user]);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push("/login");
  };

  if (isLoading) {
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
          <div className="space-y-2 text-sm text-secondary-foreground mb-6">
            <p>
              <strong>Username:</strong> {user.username}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>User ID:</strong> {user.id}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full bg-primary text-secondary px-4 py-2 font-semibold hover:opacity-90 cursor-pointer rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Logging out..." : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}
