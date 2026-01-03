"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type StatusType = "idle" | "loading" | "error" | "success";

interface Status {
  type: StatusType;
  message: string;
}

function parseHashParams(hash: string): URLSearchParams {
  if (hash.startsWith("#")) hash = hash.slice(1);
  return new URLSearchParams(hash);
}

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({
    type: "idle",
    message: "",
  });

  useEffect(() => {
    const params = parseHashParams(window.location.hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setStatus({
        type: "error",
        message: "Invalid or expired reset link. Please request a new one.",
      });
      return;
    }

    setStatus({ type: "loading", message: "Validating reset link..." });

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
              "Could not validate reset link. Please request a new one.",
          });
        } else {
          setStatus({
            type: "success",
            message: "Link verified. Enter a new password.",
          });
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "loading", message: "Updating password..." });

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus({
        type: "error",
        message: "Password update failed. Please try again.",
      });
      return;
    }

    setStatus({
      type: "success",
      message: "Password updated successfully! Redirecting...",
    });

    setTimeout(() => router.push("/"), 1500);
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>Reset Password</h2>

      <p>{status.message}</p>

      {status.type === "success" && (
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", marginTop: 10 }}
          />
          <button type="submit" style={{ marginTop: 15 }}>
            Change Password
          </button>
        </form>
      )}
    </div>
  );
}