"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase"; // adjust path if needed

type StatusType = "idle" | "loading" | "error" | "success";

interface Status {
type: StatusType;
message: string;
}

export default function ForgotPasswordPage() {
const [email, setEmail] = useState("");
const [status, setStatus] = useState<Status>({
type: "idle",
message: "",
});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!email) {
    setStatus({
      type: "error",
      message: "Please enter your email address.",
    });
    return;
  }

  setStatus({ type: "loading", message: "Sending reset link..." });

  // Build redirect URL on the client so it matches the real host (localhost or bankofuniqueideas.com)
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "https://bankofuniqueideas.com";

  const redirectTo = `${origin}/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.error(error);
    setStatus({
      type: "error",
      message:
        "Could not send reset email. Please check the email and try again.",
    });
    return;
  }

  setStatus({
    type: "success",
    message:
      "If this email is registered, a password reset link has been sent.",
  });
};
return (
<main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
<div className="w-full max-w-md p-8 bg-slate-900 rounded-xl shadow-lg">
<h1 className="text-2xl font-semibold mb-4 text-center">
Forgot Password
</h1>

<form onSubmit={handleSubmit} className="space-y-4">  
      <div>  
        <label className="block mb-1 text-sm" htmlFor="email">  
          Email address  
        </label>  
        <input  
          id="email"  
          type="email"  
          className="w-full rounded-md px-3 py-2 bg-slate-800 border border-slate-700 focus:outline-none focus:ring focus:ring-emerald-500"  
          value={email}  
          onChange={(e) => setEmail(e.target.value)}  
          required  
        />  
      </div>  

      <button  
        type="submit"  
        disabled={status.type === "loading"}  
        className="w-full py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60"  
      >  
        {status.type === "loading" ? "Sending..." : "Send reset link"}  
      </button>  
    </form>  

    {status.type !== "idle" && (  
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