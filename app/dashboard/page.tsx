"use client";
import { useAppSelector } from "@/store/hooks";

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

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
