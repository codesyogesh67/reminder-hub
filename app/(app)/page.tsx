// app/page.tsx
"use client";

import { useMemo } from "react";
import {
  useReminderStore,
  type StatusFilter,
  type PriorityFilter,
} from "@/components/reminders/reminder-store";
import { ReminderCard } from "@/components/reminders/reminder-card";
import { FilterPillGroup } from "@/components/reminders/filter-pill-group";

export default function HomePage() {
  const { reminders, filters, setFilters, view, areas } = useReminderStore();

  const filteredReminders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    return reminders.filter((r) => {
      if(!r.dueAt) return false;
      const due = new Date(r.dueAt);
      if(Number.isNaN(due.getTime())) return false;

      const dueStr = due.toDateString();

      // View logic
      if (view === "today" && dueStr !== todayStr) return false;
      if (view === "upcoming" && due <= now) return false;

      // ✅ Area filter (normalized)
      if (filters.area !== "all" && r.areaId !== filters.area) return false;

      // Status filter
      if (filters.status !== "all" && r.status !== filters.status) return false;

      // Priority filter
      if (filters.priority !== "all" && r.priority !== filters.priority)
        return false;

      return true;
    });
  }, [reminders, filters, view]);

  const groupedByAreaId = useMemo(() => {
    const groups = new Map<string, typeof reminders>();

    for (const r of filteredReminders) {
      const key = r.areaId ?? "__no_area__";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }

    return groups;
  }, [filteredReminders, reminders]);

  const totalCount = filteredReminders.length;

  return (
    <div className="space-y-6">
      {/* Summary / Filters */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Overview
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Showing{" "}
            <span className="font-semibold text-sky-400">{totalCount}</span>{" "}
            reminder{totalCount === 1 ? "" : "s"} in this view.
          </p>
        </div>

       
      </section>

      {/* Area sections */}
      <section className="space-y-4">
        {areas.map((area) => {
          const items = groupedByAreaId.get(area.id) ?? [];
          if (!items.length) return null;

          return (
            <div key={area.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {area.label}
                </h2>
                <span className="text-xs text-slate-500">
                  {items.length} reminder{items.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((reminder) => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Optional: show reminders with no area */}
        {(() => {
          const noAreaItems = groupedByAreaId.get("__no_area__") ?? [];
          if (!noAreaItems.length) return null;

          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  No area
                </h2>
                <span className="text-xs text-slate-500">
                  {noAreaItems.length} reminder
                  {noAreaItems.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {noAreaItems.map((reminder) => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            </div>
          );
        })()}

        {totalCount === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-100">
              Nothing in this view yet.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Try changing filters, picking another view, or creating a new
              reminder using the &quot;+ New&quot; button.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
