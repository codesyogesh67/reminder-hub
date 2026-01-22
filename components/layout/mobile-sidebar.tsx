// components/layout/mobile-sidebar.tsx
"use client";

import { useState, FormEvent } from "react";
import {
  useReminderStore,
  type View,
} from "@/components/reminders/reminder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { CleanupSettings } from "@/components/reminders/cleanup-settings";

const viewLabels: { key: View; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "all", label: "All reminders" },
];

export function MobileSidebar() {
  const {
    filters,
    setAreaFilter,
    view,
    setView,
    areas,
    addArea,
  } = useReminderStore();

  const [open, setOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");

  const setAllAreas = () => setAreaFilter("all");

  function handleViewClick(nextView: View) {
    setView(nextView);
    setOpen(false);
  }

async function handleAddArea(e: FormEvent) {
    e.preventDefault();
    const label = newAreaName.trim();
    if (!label) return;
    const id = await addArea(label);
    setAreaFilter(id);
    setNewAreaName("");
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-100 hover:bg-slate-900"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="flex w-72 flex-col gap-4 border-slate-800 bg-slate-950 text-slate-50"
      >
        <SheetHeader className="mb-1">
          <SheetTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-sky-500 text-xs font-bold text-slate-950">
              RH
            </span>
            <span>Reminder Hub</span>
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable content */}
        <div className="px-2 flex-1 space-y-4 overflow-y-auto pb-4">
          {/* Views */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
              Views
            </p>
            <div className="space-y-1">
              {viewLabels.map(({ key, label }) => {
                const active = view === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleViewClick(key)}
                    className={[
                      "w-full rounded-lg px-2 py-1.5 text-left",
                      active
                        ? "bg-sky-500/10 text-sky-300"
                        : "text-slate-300 hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Areas */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
              Areas
            </p>

            <button
              type="button"
              onClick={() => {
                setAllAreas();
                setOpen(false);
              }}
              className={[
                "mb-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-[0.18em]",
                filters.area === "all"
                  ? "bg-sky-500/10 text-sky-300"
                  : "text-slate-400 hover:bg-slate-800",
              ].join(" ")}
            >
              All areas
            </button>

            <div className="space-y-1">
              {areas.map((area) => {
                const active = filters.area === area.id;
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => {
                      setAreaFilter(area.id);
                      setOpen(false);
                    }}
                    className={[
                      "w-full rounded-lg px-2 py-1.5 text-left",
                      active
                        ? "bg-sky-500/10 text-sky-300"
                        : "text-slate-300 hover:bg-slate-800",
                    ].join(" ")}
                  >
                    {area.label}
                  </button>
                );
              })}
            </div>

            {/* Add area form */}
            <form onSubmit={handleAddArea} className="mt-3 space-y-1.5">
              <p className="text-[11px] text-slate-500">Add new area</p>
              <div className="flex items-center gap-2">
                <Input
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder="e.g. Work, Travel…"
                  className="h-8 flex-1 rounded-lg border-slate-800 bg-slate-900/70 text-xs"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8 rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400 text-lg"
                >
                  +
                </Button>
              </div>
            </form>
          </div>

          {/* Auto-cleanup settings (same as desktop) */}
          <CleanupSettings />
        </div>
      </SheetContent>
    </Sheet>
  );
}
