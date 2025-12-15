"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutThunk, fetchProfileFromSupabase } from "@/store/features/AuthReducer";

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // If no user in Redux after initialization, try to fetch it
    // initializeAuth (called in App.tsx) already checks authentication
    if (!user && !isLoading) {
      dispatch(fetchProfileFromSupabase()).catch(() => {
        // If fetch fails (user not authenticated), redirect to login
        router.push("/login");
      });
    }
  }, [user, isLoading, dispatch, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-primary-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-2xl font-bold text-primary-foreground mb-6">
        Welcome to Dashboard!
      </h2>
      {user && (
        <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full">
          <h3 className="text-xl font-semibold text-primary-foreground mb-4">
            User Information
          </h3>
          <div className="space-y-2 text-sm text-secondary-foreground">
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
        </div>
      )}
    </div>
  );
}
