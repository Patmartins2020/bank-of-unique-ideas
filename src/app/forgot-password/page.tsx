"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; // adjust to your real path

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

  // 1) Read tokens from the hash and set the Supabase session
  useEffect(() => {
    const hash = window.location.hash;

    if (!hash) {
      setStatus({
        type: "error",
        message: "Invalid or expired reset link. Please request a new one.",
      });
      return;
    }

    const params = new URLSearchParams(hash.substring(1)); // remove "#"
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setStatus({
        type: "error",
        message: "Invalid or expired reset link. Please request a new one.",
      });
      return;
    }

    setStatus({
      type: "loading",
      message: "Validating reset link...",
    });

    supabase.auth
      .setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      .then(({ error }) => {
        if (error) {
          console.error(error);
          setStatus({
            type: "error",
            message:
              "Could not validate the reset link. Please request a new one.",
          });
        } else {
          setStatus({
            type: "idle",
            message: "",
          });
        }
      });
  }, []);

  // 2) Handle new password submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error(error);
      setStatus({
        type: "error",
        message: "Could not update password. Please try again.",
      });
      return;
    }

    setStatus({
      type: "success",
      message: "Password updated successfully. Redirecting to login...",
    });

    // 3) Redirect to login after a short delay
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  };

  const isLoading = status.type === "loading";

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-md p-8 bg-slate-900 rounded-xl shadow-lg">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          Reset Password
        </h1>

        <p className="text-sm text-slate-300 mb-4 text-center">
          Enter a new password for your account.
        </p>

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