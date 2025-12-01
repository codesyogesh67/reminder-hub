// components/layout/sidebar.tsx
"use client";

import { useState, FormEvent } from "react";
import {
  useReminderStore,
  type View,
} from "@/components/reminders/reminder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const viewLabels: { key: View; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "all", label: "All reminders" },
];

export default function Sidebar() {
  const {
    filters,
    setAreaFilter,
    view,
    setView,
    areas,
    addArea,
  } = useReminderStore();

  const [newAreaName, setNewAreaName] = useState("");

  const setAllAreas = () => setAreaFilter("all");

  function handleViewClick(nextView: View) {
    setView(nextView);
  }

  function handleAddArea(e: FormEvent) {
    e.preventDefault();
    const label = newAreaName.trim();
    if (!label) return;
    const id = addArea(label);
    setAreaFilter(id);
    setNewAreaName("");
  }

  return (
    <aside className="hidden w-64 border-r border-slate-800 bg-slate-950/80 px-4 py-6 md:flex md:flex-col">
      <div className="mb-6 flex items-center gap-2">
        <div className="h-7 w-7 rounded-xl bg-sky-500" />
        <span className="text-lg font-semibold tracking-tight">
          Reminder Hub
        </span>
      </div>

      <nav className="space-y-1 text-sm">
        <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
          Views
        </p>

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

        <p className="mt-4 mb-2 text-xs font-semibold uppercase text-slate-400">
          Areas
        </p>

        <button
          type="button"
          onClick={setAllAreas}
          className={[
            "w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-[0.18em]",
            filters.area === "all"
              ? "bg-sky-500/10 text-sky-300"
              : "text-slate-400 hover:bg-slate-800",
          ].join(" ")}
        >
          All areas
        </button>

        {/* Existing areas (dynamic) */}
        {areas.map((area) => {
          const active = filters.area === area.id;
          return (
            <button
              key={area.id}
              type="button"
              onClick={() => setAreaFilter(area.id)}
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

        {/* Add new area form */}
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
      </nav>
    </aside>
  );
}
