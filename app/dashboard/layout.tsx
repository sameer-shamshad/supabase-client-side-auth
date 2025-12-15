'use client';
import React from "react";
import { useRouter } from "next/navigation";
import withAuth from "@/components/withAuth";
import { logoutThunk } from "@/store/features/AuthReducer";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <header className="w-full bg-primary text-secondary py-4 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
          
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:flex items-center gap-3">
                <div className="text-sm">
                  <p className="font-medium">{user.username}</p>
                  <p className="text-xs opacity-80">{user.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="bg-secondary text-primary px-4 py-2 text-sm font-semibold rounded-md transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}

// Protect the dashboard layout with authentication HOC
export default withAuth(DashboardLayoutContent);