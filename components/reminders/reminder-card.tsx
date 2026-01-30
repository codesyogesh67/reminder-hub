// components/reminders/reminder-card.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Reminder, Priority } from "@/lib/reminder";
import { RefreshCw, Flag, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { useReminderStore } from "@/components/reminders/reminder-store";

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toISODateLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function fromISODateLocal(iso: string) {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function ReminderCard({ reminder }: { reminder: Reminder }) {
  const {
    toggleReminderStatus,
    deleteReminder,
    areas,
    moveReminder,
    updateReminderTitle,
    updateReminderDueAt,
  } = useReminderStore();

  const [mounted, setMounted] = useState(false);

  const [moving, setMoving] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(reminder.title);

  const [editingDue, setEditingDue] = useState(false);

  type DateMode = "none" | "today" | "tomorrow" | "pick";
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [pickedDate, setPickedDate] = useState<string>("");

  const [hasTimeLocal, setHasTimeLocal] = useState(false);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<"am" | "pm">("am");

  const [forceTimeMode, setForceTimeMode] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setTitleDraft(reminder.title), [reminder.title]);

  const openDueEditor = (forceTime?: boolean) => {
    const due = new Date(reminder.dueAt);
    const now = new Date();

    // setForceTimeMode(Boolean(forceTime));
    setHasTimeLocal(forceTime ? true : Boolean(reminder.hasTime));

    const startToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const startDayAfter = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 2
    );

    if (due >= startToday && due < startTomorrow) {
      setDateMode("today");
      setPickedDate(toISODateLocal(startToday));
    } else if (due >= startTomorrow && due < startDayAfter) {
      setDateMode("tomorrow");
      setPickedDate(toISODateLocal(startTomorrow));
    } else {
      setDateMode("pick");
      setPickedDate(toISODateLocal(due));
    }

    let h = due.getHours();
    const m = due.getMinutes();

    const nextAmPm: "am" | "pm" = h >= 12 ? "pm" : "am";
    h = h % 12;
    if (h === 0) h = 12;

    setHour(h);
    setMinute(m - (m % 5));
    setAmpm(nextAmPm);

    setEditingDue(true);
  };

  const closeDueEditor = () => {
    setEditingDue(false);
    setForceTimeMode(false);
  };

  const saveDue = () => {
    if (dateMode === "none") {
      updateReminderDueAt(reminder.id, null, false);
      closeDueEditor();
      return;
    }
    const now = new Date();
    let base: Date;

    if (dateMode === "today") {
      base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateMode === "tomorrow") {
      base = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else {
      base = pickedDate
        ? fromISODateLocal(pickedDate)
        : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const final = new Date(base);

    if (hasTimeLocal) {
      let h24 = hour % 12;
      if (ampm === "pm") h24 += 12;
      final.setHours(h24, minute, 0, 0);
    } else {
      final.setHours(12, 0, 0, 0);
    }

    updateReminderDueAt(reminder.id, final.toISOString(), hasTimeLocal);

    closeDueEditor();
  };

  const { timeLabel, dayLabel } = useMemo(() => {
    if (!reminder.dueAt) {
      return {
        timeLabel: null,
        dayLabel: "+ Add time",
      };
    }
    const due = new Date(reminder.dueAt);

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const startOfDayAfterTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 2
    );

    const time = due.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

    const date = due.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    const isToday = due >= startOfToday && due < startOfTomorrow;
    const isTomorrow = due >= startOfTomorrow && due < startOfDayAfterTomorrow;

    return {
      timeLabel: time,
      dayLabel: isToday ? "Today" : isTomorrow ? "Tomorrow" : date,
    };
  }, [reminder.dueAt]);

  const isOverdue = useMemo(() => {
    if (!reminder.dueAt) return false;
    if (reminder.status === "done") return false;

    const now = Date.now();
    const due = new Date(reminder.dueAt);

    if (reminder.hasTime) return due.getTime() < now;

    const end = new Date(due);
    end.setHours(23, 59, 59, 999);
    return end.getTime() < now;
  }, [reminder.dueAt, reminder.hasTime, reminder.status]);

  const priorityColor =
    reminder.priority === "high"
      ? "text-rose-400"
      : reminder.priority === "medium"
      ? "text-amber-300"
      : "text-emerald-300";

  const statusIcon =
    reminder.status === "done" ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    ) : (
      <Circle className="h-4 w-4 text-slate-500" />
    );

  const titleClasses =
    "font-medium text-slate-50" +
    (reminder.status === "done" ? " line-through text-slate-500" : "");

  const areaLabel = reminder.areaId
    ? areas.find((a) => a.id === reminder.areaId)?.label ?? "Unknown"
    : "No area";

  return (
    <div
      className={[
        "group flex h-auto self-start flex-col overflow-visible rounded-2xl border p-3.5 text-sm shadow-sm shadow-slate-950/60 transition hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-lg hover:shadow-sky-950/40",
        isOverdue
          ? "border-rose-500/60 bg-rose-950/15 hover:border-rose-400/70"
          : "border-slate-800/80 bg-slate-900/70 hover:border-sky-500/60",
      ].join(" ")}
    >
      <div className="mb-2 flex items-start gap-2">
        <button
          type="button"
          onClick={() => toggleReminderStatus(reminder.id)}
          className="mt-0.5 rounded-full border border-slate-700 bg-slate-950/60 p-1 transition hover:border-sky-500 hover:bg-slate-900"
        >
          {statusIcon}
        </button>

        <div className="flex-1">
          {!editingTitle ? (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className={titleClasses + " text-left cursor-pointer"}
              title="Click to edit"
            >
              {reminder.title}
            </button>
          ) : (
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-950/40 px-2 py-1 text-sm text-slate-50 outline-none focus:border-sky-500/60"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setTitleDraft(reminder.title);
                  setEditingTitle(false);
                }
                if (e.key === "Enter") {
                  updateReminderTitle(reminder.id, titleDraft);
                  setEditingTitle(false);
                }
              }}
              onBlur={() => {
                updateReminderTitle(reminder.id, titleDraft);
                setEditingTitle(false);
              }}
            />
          )}

          {reminder.note ? (
            <p className="mt-1 line-clamp-2 text-xs text-slate-400">
              {reminder.note}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => deleteReminder(reminder.id)}
          className="ml-1 rounded-full border border-transparent p-1 text-slate-500 opacity-0 transition group-hover:opacity-100 hover:border-rose-500/60 hover:bg-rose-950/30 hover:text-rose-400"
          aria-label="Delete reminder"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Footer */}
      <div
        className={[
          "mt-auto pt-2 text-[11px] text-slate-400",
          editingDue
            ? "overflow-hidden flex flex-col gap-2"
            : "overflow-hidden flex items-center justify-between",
        ].join(" ")}
      >
        {!editingDue ? (
          <div className="flex items-center gap-2">
            {mounted ? (
              <button
                type="button"
                onClick={openDueEditor}
                className="inline-flex items-center rounded-full bg-slate-950/70 px-2 py-1 text-slate-300 transition hover:bg-slate-900"
                title="Edit date/time"
              >
                <span>{dayLabel}</span>
                <span className="ml-1 text-slate-400">
                  {reminder.hasTime ? timeLabel : null}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setHasTimeLocal(false);
                  openDueEditor();
                }}
                className="inline-flex items-center rounded-full bg-slate-950/70 px-2 py-1 text-slate-300 transition hover:bg-slate-900"
                title="Add a time"
              >
                + Add time
              </button>
            )}

            {isOverdue ? (
              <span className="inline-flex items-center rounded-full border border-rose-500/40 bg-rose-950/30 px-2 py-1 text-rose-200">
                Overdue
              </span>
            ) : null}

            <div className="relative flex items-center">
              {!moving ? (
                <button
                  onClick={() => setMoving(true)}
                  className="rounded-full border border-slate-800 bg-slate-950/60 px-2 py-0.5 text-[10px] text-slate-300 hover:border-sky-500/60"
                >
                  {areaLabel}
                </button>
              ) : (
                <div
                  className="absolute z-20 mt-1 w-28 rounded-xl border border-slate-800 bg-slate-950 shadow-lg"
                  onMouseLeave={() => setMoving(false)}
                >
                  {areas.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        moveReminder(reminder.id, a.id);
                        setMoving(false);
                      }}
                      className="block w-full px-2 py-1 text-left text-[11px] hover:bg-slate-800"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // ✅ Extended editor UI (wraps into new lines)
          <div className="flex w-full flex-col gap-2">
            {/* Row 1: Date */}
            <div className="flex w-full flex-wrap items-center gap-2">
              <select
                className="rounded-xl border border-slate-800 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200 outline-none"
                value={dateMode}
                onChange={(e) => setDateMode(e.target.value as any)}
              >
                <option value="none">No date</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="pick">Pick date…</option>
              </select>

              {dateMode === "pick" ? (
                <input
                  type="date"
                  value={pickedDate}
                  onChange={(e) => setPickedDate(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200 outline-none"
                />
              ) : null}
            </div>
            {dateMode !== "none" && (
              <div>
                <label className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={hasTimeLocal}
                    onChange={(e) => {
                      if (forceTimeMode) return; // keep on for Add Time flow
                      setHasTimeLocal(e.target.checked);
                    }}
                  />
                  Time
                </label>
                {hasTimeLocal ? (
                  <div className="flex flex-wrap items-center gap-1">
                    <select
                      className="rounded-xl border border-slate-800 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200 outline-none"
                      value={hour}
                      onChange={(e) => setHour(Number(e.target.value))}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>

                    <span className="text-slate-500">:</span>
                    <select
                      className="rounded-xl border border-slate-800 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200 outline-none"
                      value={minute}
                      onChange={(e) => setMinute(Number(e.target.value))}
                    >
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(
                        (m) => (
                          <option key={m} value={m}>
                            {pad2(m)}
                          </option>
                        )
                      )}
                    </select>

                    <select
                      className="rounded-xl border border-slate-800 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200 outline-none"
                      value={ampm}
                      onChange={(e) => setAmpm(e.target.value as any)}
                    >
                      <option value="am">AM</option>
                      <option value="pm">PM</option>
                    </select>
                  </div>
                ) : null}
              </div>
            )}

            {/* Row 2: Time */}

            <div className="flex w-full flex-wrap items-center gap-2">
              {/* <label className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={hasTimeLocal}
                  onChange={(e) => {
                    if (forceTimeMode) return; // keep on for Add Time flow
                    setHasTimeLocal(e.target.checked);
                  }}
                />
                Time
              </label> */}
            </div>

            {/* Row 3: Actions */}
            <div className="flex w-full items-center gap-2">
              <button
                type="button"
                onClick={saveDue}
                className="rounded-xl border border-slate-800 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500/60"
              >
                Save
              </button>
              <button
                type="button"
                onClick={closeDueEditor}
                className="rounded-xl border border-transparent px-2 py-1 text-[11px] text-slate-500 hover:text-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!editingDue ? (
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 ${priorityColor}`}>
              <Flag className="h-3 w-3" />
              <span className="capitalize">
                {PRIORITY_LABELS[reminder.priority]}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-slate-400">
              <RefreshCw className="h-3 w-3" />
              <span className="capitalize">{reminder.frequency}</span>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
