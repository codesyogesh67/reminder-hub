"use client";

import { useEffect, useState } from "react";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/60 p-8">
          <div className="h-6 w-40 rounded bg-slate-800/70" />
          <div className="mt-6 space-y-3">
            <div className="h-10 rounded bg-slate-900/70" />
            <div className="h-10 rounded bg-slate-900/70" />
            <div className="h-10 rounded bg-slate-900/70" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <SignIn />

        {/* This sits visually as the "card footer" */}
        <div className="-mt-3 rounded-b-2xl bg-slate-950/60 px-6 py-4 text-center">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-slate-200 underline underline-offset-4"
          >
            Continue as guest →
          </Link>
        </div>
      </div>
    </div>
  );
}
