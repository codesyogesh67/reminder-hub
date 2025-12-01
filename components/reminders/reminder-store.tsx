// components/reminders/reminder-store.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Area,
  Priority,
  Status,
  Reminder,
  ReminderInput,
} from "@/lib/reminder";

export type AreaFilter = "all" | Area;
export type StatusFilter = "all" | Status;
export type PriorityFilter = "all" | Priority;
export type View = "today" | "upcoming" | "all";

export type Filters = {
  area: AreaFilter;
  status: StatusFilter;
  priority: PriorityFilter;
};

export type AreaDefinition = {
  id: Area;
  label: string;
};

type ReminderStoreValue = {
  // data
  reminders: Reminder[];
  areas: AreaDefinition[];

  // actions
  addReminder: (input: ReminderInput) => void;
  toggleReminderStatus: (id: string) => void;
  addArea: (label: string) => Area; // returns new area id

  // view / filters
  view: View;
  setView: (view: View) => void;

  filters: Filters;
  setFilters: (updater: (prev: Filters) => Filters) => void;
  setAreaFilter: (area: AreaFilter) => void;
};

const ReminderStoreContext = createContext<ReminderStoreValue | null>(null);

// helper to slugify area id
function toAreaId(label: string): Area {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "area";
}

// Initial areas
const INITIAL_AREAS: AreaDefinition[] = [
  { id: "health", label: "Health" },
  { id: "coding", label: "Coding" },
  { id: "family", label: "Family" },
  { id: "money", label: "Money" },
  { id: "other", label: "Other" },
];

// Initial mock reminders (in-memory only)
const INITIAL_REMINDERS: Reminder[] = [
  {
    id: "1",
    title: "Drink 500ml water",
    note: "Right after waking up.",
    area: "health",
    dueAt: new Date().toISOString(),
    frequency: "daily",
    priority: "medium",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "45 min coding session",
    note: "Reminder Hub UI polish.",
    area: "coding",
    dueAt: new Date(
      new Date().setHours(new Date().getHours() + 2)
    ).toISOString(),
    frequency: "daily",
    priority: "high",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Call parents",
    note: "Ask about their week and health.",
    area: "family",
    dueAt: new Date(new Date().setHours(21, 0, 0, 0)).toISOString(),
    frequency: "weekly",
    priority: "high",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Review expenses",
    note: "Update Notion & check subscriptions.",
    area: "money",
    dueAt: new Date(
      new Date().setDate(new Date().getDate() + 1)
    ).toISOString(),
    frequency: "weekly",
    priority: "medium",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    title: "Read 10 pages",
    note: "Continue ‘Why We Sleep’.",
    area: "other",
    dueAt: new Date(new Date().setHours(23, 0, 0, 0)).toISOString(),
    frequency: "daily",
    priority: "low",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

export function ReminderProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>(INITIAL_REMINDERS);
  const [areas, setAreas] = useState<AreaDefinition[]>(INITIAL_AREAS);

  const [view, setView] = useState<View>("today");

  const [filters, updateFilters] = useState<Filters>({
    area: "all",
    status: "pending",
    priority: "all",
  });

  const addReminder = useCallback((input: ReminderInput) => {
    const now = new Date().toISOString();
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const reminder: Reminder = {
      id,
      title: input.title,
      note: input.note ?? "",
      area: input.area,
      dueAt: input.dueAt,
      frequency: input.frequency,
      priority: input.priority,
      status: input.status ?? "pending",
      createdAt: now,
    };

    setReminders((prev) => [reminder, ...prev]);
  }, []);

  const toggleReminderStatus = useCallback((id: string) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: r.status === "done" ? "pending" : "done",
            }
          : r
      )
    );
  }, []);

  const setFilters = useCallback(
    (updater: (prev: Filters) => Filters) => {
      updateFilters((prev) => updater(prev));
    },
    [updateFilters]
  );

  const setAreaFilter = useCallback(
    (area: AreaFilter) => {
      updateFilters((prev) => ({ ...prev, area }));
    },
    [updateFilters]
  );

  const addArea = useCallback(
    (label: string): Area => {
      const trimmed = label.trim();
      if (!trimmed) return "other";

      const baseId = toAreaId(trimmed);

      // prevent collisions
      let candidate = baseId;
      let counter = 2;
      const existingIds = new Set(areas.map((a) => a.id));
      while (existingIds.has(candidate)) {
        candidate = `${baseId}-${counter++}`;
      }

      const def: AreaDefinition = { id: candidate, label: trimmed };
      setAreas((prev) => [...prev, def]);

      return candidate;
    },
    [areas]
  );

  const value = useMemo(
    () => ({
      reminders,
      areas,
      addReminder,
      toggleReminderStatus,
      addArea,
      view,
      setView,
      filters,
      setFilters,
      setAreaFilter,
    }),
    [
      reminders,
      areas,
      addReminder,
      toggleReminderStatus,
      addArea,
      view,
      setView,
      filters,
      setFilters,
      setAreaFilter,
    ]
  );

  return (
    <ReminderStoreContext.Provider value={value}>
      {children}
    </ReminderStoreContext.Provider>
  );
}

export function useReminderStore(): ReminderStoreValue {
  const ctx = useContext(ReminderStoreContext);
  if (!ctx) {
    throw new Error("useReminderStore must be used within ReminderProvider");
  }
  return ctx;
}
