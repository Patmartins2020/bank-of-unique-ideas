"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; // same path you use in forgot-password

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic checks
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

    if (password.length < 6) {
      setStatus({
        type: "error",
        message: "Password should be at least 6 characters long.",
      });
      return;
    }

    setStatus({
      type: "loading",
      message: "Updating your password...",
    });

    // IMPORTANT: Supabase uses the one-time token from the URL automatically.
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("Update password error:", error);

      // Nice message if the token is really expired
      const msg =
        error.message.toLowerCase().includes("expired") ||
        error.message.toLowerCase().includes("invalid")
          ? "This reset link is invalid or has expired. Please request a new password reset email."
          : "Could not update password. Please try again.";

      setStatus({
        type: "error",
        message: msg,
      });
      return;
    }

    setStatus({
      type: "success",
      message: "Password updated successfully. Redirecting to login...",
    });

    // Redirect to login after a short delay
    setTimeout(() => {
      router.push("/login"); // change to "/investor/ideas" if you prefer
    }, 2000);
  };

  const isLoading = status.type === "loading";

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-md p-8 bg-slate-900 rounded-xl shadow-lg">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          Enter a new password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-md px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none focus:ring focus:ring-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="w-full rounded-md px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none focus:ring focus:ring-emerald-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60"
          >
            {isLoading ? "Saving..." : "Update password"}
          </button>
        </form>

        {status.message && (
          <p
            className={`mt-4 text-sm text-center ${
              status.type === "error" ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {status.message}
          </p>
        )}
      </div>
    </main>
  );
}