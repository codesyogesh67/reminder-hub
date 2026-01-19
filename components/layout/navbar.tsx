// components/layout/navbar.tsx
"use client";

import { useEffect, useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { NewReminderDialog } from "@/components/reminders/new-reminder-dialog";
import { useReminderStore } from "@/components/reminders/reminder-store";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

const VIEW_TITLE: Record<
  import("@/components/reminders/reminder-store").View,
  { label: string; subtitle: string }
> = {
  today: {
    label: "Today",
    subtitle: "Dialed-in reminders for the next 24 hours.",
  },
  upcoming: {
    label: "Upcoming",
    subtitle: "See what’s coming next so nothing surprises you.",
  },
  all: {
    label: "All reminders",
    subtitle: "A full overview of everything you’ve captured.",
  },
};

export default function Navbar() {
  const { view, filters, areas, addReminder } = useReminderStore();
  const title = VIEW_TITLE[view];

  const [quickTitle, setQuickTitle] = useState("");

  // ✅ Fix hydration mismatch for Clerk components
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function handleQuickAddKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;

    const trimmed = quickTitle.trim();
    if (!trimmed) return;

    // decide due date based on current view
    const base = new Date();
    let due: Date;

    if (view === "upcoming") {
      // make sure it appears in Upcoming (future only)
      due = new Date(base.getTime() + 24 * 60 * 60 * 1000);
    } else {
      // today or all → now is fine
      due = base;
    }

    // choose area: current filter if specific, otherwise "General"
    const hasSpecificArea =
      typeof filters.area === "string" &&
      filters.area !== "all" &&
      filters.area.length > 0;

    let areaId: string;

    if (hasSpecificArea) {
      areaId = filters.area;
    } else {
      const general = areas.find(
        (a) => a.label.trim().toLowerCase() === "general"
      );

      // If General doesn't exist yet, fallback to first area (but ideally you create General in DB)
      areaId = general?.id ?? areas[0]?.id ?? "";
    }

    if (!areaId) return; // (optional) don't create if no areas loaded yet

    addReminder({
      title: trimmed,
      note: undefined,
      areaId: areaId,
      frequency: "once",
      priority: "medium",
      dueAt: due.toISOString(),
    });

    setQuickTitle("");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        {/* Left: mobile menu + titles */}
        <div className="flex flex-1 items-center gap-3">
          {/* Mobile: hamburger for sidebar */}
          <div className="md:hidden">
            <MobileSidebar />
          </div>

          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.15em] text-slate-400">
              {title.label}
            </span>
            <h1 className="text-sm font-semibold tracking-tight text-slate-100 md:text-xl">
              {title.subtitle}
            </h1>
          </div>
        </div>

        {/* Right: quick input + new reminder (input hidden on small) */}
        <div className="flex flex-1 justify-end gap-2">
          <Input
            className="hidden w-full max-w-md rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm outline-none ring-sky-500/40 placeholder:text-slate-500 focus-visible:ring-2 md:block"
            placeholder="Quick add a reminder… (press Enter)"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={handleQuickAddKeyDown}
          />
          <NewReminderDialog />
        </div>

        {/* ✅ Clerk: render only after mount to avoid hydration mismatch */}
        {mounted ? (
          <>
            <SignedIn>
              <UserButton afterSignOutUrl="/sign-in" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 hover:bg-slate-900">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
          </>
        ) : (
          // placeholder keeps layout stable
          <div className="h-9 w-9 rounded-full bg-slate-800/70" />
        )}
      </div>
    </header>
  );
}
