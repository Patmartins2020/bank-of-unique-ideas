"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// IMPORTANT: use the SAME import path that works in forgot-password
// If your forgot-password page uses "../../lib/supabase", use that here too.
import { supabase } from "@/lib/supabase";

type StatusType = "idle" | "loading" | "error" | "success";

interface Status {
  type: StatusType;
  message: string;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>({
    type: "idle",
    message: "",
  });
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    // Supabase puts the tokens in the URL HASH: #access_token=...&refresh_token=...
    if (typeof window === "undefined") return;

    const hash = window.location.hash; // e.g. "#access_token=xxx&refresh_token=yyy"
    if (!hash || !hash.startsWith("#")) {
      setStatus({
        type: "error",
        message:
          "Invalid reset link. Please request a new password reset email.",
      });
      return;
    }

    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      setStatus({
        type: "error",
        message:
          "Invalid or expired reset link. Please request a new password reset email.",
      });
      return;
    }

    // Exchange the recovery token for a Supabase session
    supabase.auth
      .setSession({
        access_token,
        refresh_token,
      })
      .then(({ error }) => {
        if (error) {
          console.error("Error setting session from reset link:", error);
          setStatus({
            type: "error",
            message:
              "Could not validate this reset link. Please request a new one.",
          });
        } else {
          setTokenReady(true);
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokenReady) {
      setStatus({
        type: "error",
        message:
          "Reset link is no longer valid. Please request a new password reset email.",
      });
      return;
    }

    if (!password || !confirmPassword) {
      setStatus({
        type: "error",
        message: "Please enter and confirm your new password.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({
        type: "error",
        message: "Passwords do not match.",
      });
      return;
    }

    setStatus({ type: "loading", message: "Updating your password..." });

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("Error updating password:", error);
      setStatus({
        type: "error",
        message:
          "Could not update password. This reset link may have expired. Please request a new one and try again.",
      });
      return;
    }

    setStatus({
      type: "success",
      message: "Password updated. Redirecting to login...",
    });

    // Redirect to login after a short delay
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  };

  const isError = status.type === "error";
  const isSuccess = status.type === "success";

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-md p-8 bg-slate-900 rounded-xl shadow-lg">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          Enter a new password
        </h1>

        {/* If token is bad, just show the error */}
        {!tokenReady && status.type === "error" ? (
          <p className="text-sm text-red-400 text-center">{status.message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block mb-1 text-sm font-medium"
              >
                New password
              </label>
              <input
                id="password"
                type="password"
                className="w-full rounded-md px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none focus:ring focus:ring-emerald-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-1 text-sm font-medium"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="w-full rounded-md px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none focus:ring focus:ring-emerald-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={status.type === "loading"}
              className="w-full py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60"
            >
              {status.type === "loading" ? "Updating..." : "Update password"}
            </button>

            {status.type !== "idle" && (
              <p
                className={`mt-2 text-sm text-center ${
                  isError ? "text-red-400" : isSuccess ? "text-emerald-400" : ""
                }`}
              >
                {status.message}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}