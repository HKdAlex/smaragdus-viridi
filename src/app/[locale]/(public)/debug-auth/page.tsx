"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export default function DebugAuthPage() {
  const [authState, setAuthState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Use imported supabase client

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        // Get user
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        // Get profile if user exists
        let profile = null;
        if (userData.user) {
          const { data: profileData, error: profileError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", userData.user.id)
            .single();

          profile = profileData;
        }

        setAuthState({
          session: {
            exists: !!sessionData.session,
            error: sessionError?.message,
            expiresAt: sessionData.session?.expires_at,
            refreshToken: !!sessionData.session?.refresh_token,
          },
          user: {
            exists: !!userData.user,
            error: userError?.message,
            id: userData.user?.id,
            email: userData.user?.email,
          },
          profile: {
            exists: !!profile,
            data: profile,
          },
          cookies: document.cookie,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        setAuthState({
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      checkAuth();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        // Force page reload to clear auth state
        window.location.reload();
      } else {
        alert("Sign out failed");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      alert("Sign out failed");
    }
  };

  const handleSignIn = async () => {
    const email = prompt("Enter email:");
    const password = prompt("Enter password:");

    if (email && password) {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (result.success) {
          // Force page reload to update auth state
          window.location.reload();
        } else {
          alert("Sign in failed: " + result.error);
        }
      } catch (error) {
        console.error("Sign in error:", error);
        alert("Sign in failed: " + (error as Error).message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading auth state...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>

        <div className="grid gap-6">
          {/* Auth State */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Authentication State</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(authState, null, 2)}
            </pre>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-x-4">
              <button
                onClick={handleSignIn}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Sign In
              </button>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Sign Out
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Reload
              </button>
            </div>
          </div>

          {/* Navigation Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Navigation Test</h2>
            <div className="space-x-4">
              <a
                href="/ru/profile"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
              >
                Go to Profile
              </a>
              <a
                href="/ru/orders"
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 inline-block"
              >
                Go to Orders
              </a>
              <a
                href="/ru/admin"
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 inline-block"
              >
                Go to Admin
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
