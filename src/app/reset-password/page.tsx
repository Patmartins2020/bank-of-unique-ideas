"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    async function handleRecovery() {
      if (typeof window === "undefined") return;

      const hash = window.location.hash;

      if (!hash || !hash.startsWith("#")) {
        setStatus({
          type: "error",
          message: "Invalid reset link. Please request a new one.",
        });
        return;
      }

      const params = new URLSearchParams(hash.substring(1));

      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        setStatus({
          type: "error",
          message: "Invalid or expired reset link.",
        });
        return;
      }

      // ✅ Set session properly
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error || !data.session) {
        console.error("SESSION ERROR:", error);
        setStatus({
          type: "error",
          message: "Reset link expired. Request a new one.",
        });
        return;
      }

      setTokenReady(true);
    }

    handleRecovery();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tokenReady) {
      setStatus({
        type: "error",
        message: "Session expired. Please request a new reset link.",
      });
      return;
    }

    if (!password || !confirmPassword) {
      setStatus({
        type: "error",
        message: "Please fill all fields.",
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

    setStatus({
      type: "loading",
      message: "Updating password...",
    });

    // ✅ EXTRA SAFETY CHECK
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      setStatus({
        type: "error",
        message: "Session lost. Please request a new reset link.",
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error("UPDATE ERROR:", error);
      setStatus({
        type: "error",
        message: "Reset failed. Link may have expired.",
      });
      return;
    }

    setStatus({
      type: "success",
      message: "Password updated successfully!",
    });

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

        {!tokenReady && status.type === "error" ? (
          <p className="text-sm text-red-400 text-center">
            {status.message}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="password"
              placeholder="New password"
              className="w-full px-3 py-2 rounded bg-slate-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirm password"
              className="w-full px-3 py-2 rounded bg-slate-800"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
              type="submit"
              disabled={status.type === "loading"}
              className="w-full py-2 rounded bg-emerald-500"
            >
              {status.type === "loading" ? "Updating..." : "Update password"}
            </button>

            {status.type !== "idle" && (
              <p
                className={`text-center text-sm ${
                  isError
                    ? "text-red-400"
                    : isSuccess
                    ? "text-green-400"
                    : ""
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