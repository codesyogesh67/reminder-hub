// components/reminders/reminder-card.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Reminder, Priority } from "@/lib/reminder";
import {
  Clock,
  RefreshCw,
  Flag,
  CheckCircle2,
  Circle,
  Trash2,
} from "lucide-react";
import { useReminderStore } from "@/components/reminders/reminder-store";
import { ArrowRightLeft } from "lucide-react";

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
  // iso: YYYY-MM-DD in user's local timezone
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

  // ✅ prevents SSR/CSR mismatch for locale formatting
  const [mounted, setMounted] = useState(false);

  const [moving, setMoving] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(reminder.title);
  const [editingDue, setEditingDue] = useState(false);
  const [dueDraft, setDueDraft] = useState("");
  const [dueError, setDueError] = useState<string | null>(null);

  // date picker
  type DateMode = "today" | "tomorrow" | "pick";
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [pickedDate, setPickedDate] = useState<string>(""); // YYYY-MM-DD

  // time picker
  const [hasTimeLocal, setHasTimeLocal] = useState(false);
  const [hour, setHour] = useState(9); // 1..12
  const [minute, setMinute] = useState(0); // 0,5,10...
  const [ampm, setAmpm] = useState<"am" | "pm">("am");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setTitleDraft(reminder.title);
  }, [reminder.title]);

  useEffect(() => {
    // default text shown when you open editor
    // (shows "today" or "tomorrow" or "jan 22", plus time if hasTime)
    const due = new Date(reminder.dueAt);

    const dateText = (() => {
      const now = new Date();
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

      if (due >= startToday && due < startTomorrow) return "today";
      if (due >= startTomorrow && due < startDayAfter) return "tomorrow";

      return due
        .toLocaleDateString(undefined, { month: "short", day: "numeric" })
        .toLowerCase();
    })();

    const timeText = due
      .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      .toLowerCase();

    setDueDraft(reminder.hasTime ? `${dateText} ${timeText}` : dateText);
  }, [reminder.dueAt, reminder.hasTime]);

  const openDueEditor = () => {
    const due = new Date(reminder.dueAt);
    const now = new Date();

    // set date mode
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

    // set time
    setHasTimeLocal(Boolean(reminder.hasTime));

    let h = due.getHours();
    const m = due.getMinutes();

    const nextAmPm: "am" | "pm" = h >= 12 ? "pm" : "am";
    h = h % 12;
    if (h === 0) h = 12;

    setHour(h);
    setMinute(m - (m % 5)); // snap to 5 min
    setAmpm(nextAmPm);

    setEditingDue(true);
  };

  const saveDue = () => {
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
      // date-only: use noon (stable)
      final.setHours(12, 0, 0, 0);
    }

    updateReminderDueAt(reminder.id, final.toISOString(), hasTimeLocal);
    setEditingDue(false);
  };

  const { timeLabel, dateLabel, dayLabel, isToday } = useMemo(() => {
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

    const dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : date;

    return {
      timeLabel: time,
      dateLabel: date,
      dayLabel,
      isToday,
    };
  }, [reminder.dueAt]);

  const isOverdue = useMemo(() => {
    if (reminder.status === "done") return false;

    const now = Date.now();
    const due = new Date(reminder.dueAt);

    if (reminder.hasTime) {
      return due.getTime() < now;
    }

    // date-only reminders become overdue after end of the day
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
        "group flex h-full flex-col overflow-visible rounded-2xl border p-3.5 text-sm shadow-sm shadow-slate-950/60 transition hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-lg hover:shadow-sky-950/40",
        isOverdue
          ? "border-rose-500/60 bg-rose-950/15 hover:border-rose-400/70"
          : "border-slate-800/80 bg-slate-900/70 hover:border-sky-500/60",
      ].join(" ")}
    >
      {" "}
      <div className="mb-2 flex items-start gap-2">
        <button
          type="button"
          onClick={() => toggleReminderStatus(reminder.id)}
          className="mt-0.5 rounded-full border border-slate-700 bg-slate-950/60 p-1 transition hover:border-sky-500 hover:bg-slate-900"
        >
          {statusIcon}
        </button>

        <div className="flex-1">
          {/* <p className={titleClasses}>{reminder.title}</p> */}

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
                // choose one behavior:
                // (A) save on blur:
                updateReminderTitle(reminder.id, titleDraft);
                setEditingTitle(false);

                // (B) or cancel on blur (more conservative):
                // setTitleDraft(reminder.title);
                // setEditingTitle(false);
              }}
            />
          )}

          {reminder.note && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-400">
              {reminder.note}
            </p>
          )}
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
      {/* <div className="overflow-hidden mt-auto flex items-center justify-between pt-2 text-[11px] text-slate-400"> */}
      <div
        className={[
          "mt-auto pt-2 text-[11px] text-slate-400",
          editingDue
            ? "overflow-visible flex flex-wrap items-start gap-2"
            : "overflow-hidden flex items-center justify-between",
        ].join(" ")}
      >
        {/* <div className="flex items-center gap-2"> */}
        <div
          className={[
            "flex items-center gap-2",
            editingDue ? "flex-wrap" : "flex-nowrap",
          ].join(" ")}
        >
          {!editingDue ? (
            <button
              type="button"
              onClick={openDueEditor}
              className="inline-flex items-center rounded-full bg-slate-950/70 px-2 py-1 text-slate-300 transition hover:bg-slate-900"
              title="Edit date/time"
            >
              <span>{mounted ? dayLabel : "—"}</span>
              {reminder.hasTime ? (
                <span className="ml-1 text-slate-400">
                  • {mounted ? timeLabel : "--:--"}
                </span>
              ) : null}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {/* Date select */}
              <select
                className="rounded-xl border border-slate-800 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200 outline-none"
                value={dateMode}
                onChange={(e) => setDateMode(e.target.value as any)}
              >
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="pick">Pick date…</option>
              </select>

              {/* Calendar (only when pick) */}
              {dateMode === "pick" ? (
                <input
                  type="date"
                  value={pickedDate}
                  onChange={(e) => setPickedDate(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200 outline-none"
                />
              ) : null}

              {/* Time toggle */}
              <label className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                <input
                  type="checkbox"
                  checked={hasTimeLocal}
                  onChange={(e) => setHasTimeLocal(e.target.checked)}
                />
                Time
              </label>

              {/* Time selects */}
              {hasTimeLocal ? (
                <div className="flex items-center gap-1">
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
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                      <option key={m} value={m}>
                        {pad2(m)}
                      </option>
                    ))}
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

              {/* Actions */}
              <button
                type="button"
                onClick={saveDue}
                className="rounded-xl border border-slate-800 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500/60"
              >
                Save
              </button>

              <button
                type="button"
                onClick={() => setEditingDue(false)}
                className="rounded-xl border border-transparent px-2 py-1 text-[11px] text-slate-500 hover:text-slate-200"
              >
                Cancel
              </button>
            </div>
          )}

          {isOverdue && (
            <span className="inline-flex items-center rounded-full border border-rose-500/40 bg-rose-950/30 px-2 py-1 text-rose-200">
              Overdue
            </span>
          )}

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black">
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
        </div>

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
      </div>
    </div>
  );
}

function parseDueInput(
  input: string,
  currentDueAtIso: string
): { dueAtIso: string; hasTime: boolean } | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;

  const now = new Date();
  let baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // start of today
  let hasDate = false;

  // --- date parsing ---
  // keywords
  if (text.includes("today")) {
    baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    hasDate = true;
  } else if (text.includes("tomorrow")) {
    baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    hasDate = true;
  } else {
    // ISO date like 2026-01-20
    const isoDateMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (isoDateMatch) {
      const y = Number(isoDateMatch[1]);
      const m = Number(isoDateMatch[2]) - 1;
      const d = Number(isoDateMatch[3]);
      baseDate = new Date(y, m, d);
      hasDate = true;
    } else {
      // Month name + day, e.g. "jan 25" or "january 25"
      const mdMatch = text.match(
        /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})\b/
      );
      if (mdMatch) {
        const monthMap: Record<string, number> = {
          jan: 0,
          january: 0,
          feb: 1,
          february: 1,
          mar: 2,
          march: 2,
          apr: 3,
          april: 3,
          may: 4,
          jun: 5,
          june: 5,
          jul: 6,
          july: 6,
          aug: 7,
          august: 7,
          sep: 8,
          sept: 8,
          september: 8,
          oct: 9,
          october: 9,
          nov: 10,
          november: 10,
          dec: 11,
          december: 11,
        };
        const month = monthMap[mdMatch[1]];
        const day = Number(mdMatch[2]);

        // choose this year, but if already passed, roll to next year
        const candidate = new Date(now.getFullYear(), month, day);
        const startToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        baseDate =
          candidate < startToday
            ? new Date(now.getFullYear() + 1, month, day)
            : candidate;

        hasDate = true;
      }
    }
  }

  // If user didn't specify any date at all, keep the existing reminder date (so they can type only "6pm")
  if (!hasDate) {
    const existing = new Date(currentDueAtIso);
    baseDate = new Date(
      existing.getFullYear(),
      existing.getMonth(),
      existing.getDate()
    );
  }

  // --- time parsing ---
  // formats: 6pm, 6:30pm, 18:00, 9, 9:15
  let hasTime = false;
  let hours = 9;
  let minutes = 0;

  const timeMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (timeMatch) {
    let h = Number(timeMatch[1]);
    const mm = timeMatch[2] ? Number(timeMatch[2]) : 0;
    const ap = timeMatch[3];

    if (ap) {
      if (ap === "pm" && h < 12) h += 12;
      if (ap === "am" && h === 12) h = 0;
      hasTime = true;
    } else {
      // if they used 24h like 18:00 or provided minutes, treat as time
      if (h > 23 || mm > 59) return null;
      if (timeMatch[2] || h > 12) hasTime = true;
      // if they typed just "9" with no am/pm, assume it's a time ONLY if they also typed "today/tomorrow/date"
      if (!hasTime && hasDate) hasTime = true;
    }

    if (h > 23 || mm > 59) return null;
    hours = h;
    minutes = mm;
  }

  // build final dueAt
  const due = new Date(baseDate);
  if (hasTime) {
    due.setHours(hours, minutes, 0, 0);
  } else {
    // date-only: set a neutral time (noon helps avoid timezone edge cases)
    due.setHours(12, 0, 0, 0);
  }

  return { dueAtIso: due.toISOString(), hasTime };
}
