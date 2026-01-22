// components/reminders/reminder-store.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
Frequency
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

export type ReminderSettings = {
  autoDeleteCompletedAfterDays: number | null; // null = never auto-delete
};

type ReminderStoreValue = {
  // data
  reminders: Reminder[];
  areas: AreaDefinition[];
  settings: ReminderSettings;

  authRequired: boolean;
  setAuthRequired: (v: boolean) => void;


  // actions
  addReminder: (input: ReminderInput) => Promise<void>;
  toggleReminderStatus: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  addArea: (label: string) => Promise<Area>; // returns new area id (UI-only for now)
  moveReminder: (id: string, areaId: string | null) => Promise<void>;
  updateReminderTitle: (id: string, title: string) => Promise<void>;
  updateReminderDueAt: (id: string, dueAt: string, hasTime: boolean) => Promise<void>;


  // settings
  setSettings: (updater: (prev: ReminderSettings) => ReminderSettings) => void;

  // view / filters
  view: View;
  setView: (view: View) => void;

  filters: Filters;
  setFilters: (updater: (prev: Filters) => Filters) => void;
  setAreaFilter: (area: AreaFilter) => void;

  // helpers
  refetchReminders: () => Promise<void>;
};

const FREQUENCIES = ["once", "daily", "weekly", "monthly", "yearly"] as const;

function toFrequency(v: unknown): Frequency {
  return (FREQUENCIES as readonly string[]).includes(String(v))
    ? (String(v) as Frequency)
    : "once";
}

const ReminderStoreContext = createContext<ReminderStoreValue | null>(null);

// helper to slugify area id (UI-only for now)
function toAreaId(label: string): Area {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "area"
  );
}

function applyAutoDelete(
  list: Reminder[],
  autoDeleteCompletedAfterDays: number | null
): Reminder[] {
  if (autoDeleteCompletedAfterDays == null) return list;

  const now = Date.now();
  const cutoffMs = autoDeleteCompletedAfterDays * 24 * 60 * 60 * 1000;

  return list.filter((r) => {
    if (r.status !== "done" || !r.completedAt) return true;
    const completedTime = new Date(r.completedAt).getTime();
    return now - completedTime <= cutoffMs;
  });
}

// UI-only areas for now (we'll move to DB next)
const INITIAL_AREAS: AreaDefinition[] = [
  { id: "health", label: "Health" },
  { id: "coding", label: "Coding" },
  { id: "family", label: "Family" },
  { id: "money", label: "Money" },
  { id: "other", label: "Other" },
];

// Map API reminder -> UI Reminder (handles Date objects/strings safely)
function normalizeReminder(r: any): Reminder {
  if (!r || typeof r !== "object") {
    throw new Error("normalizeReminder: invalid reminder payload");
  }

  return {
    id: String(r.id),
    title: String(r.title),
    note: r.note ?? "",
    areaId: r.areaId ?? null,
    dueAt: typeof r.dueAt === "string" ? r.dueAt : new Date(r.dueAt).toISOString(),
    hasTime: Boolean(r.hasTime),
    frequency: toFrequency(r.frequency),
    priority: r.priority,
    status: r.status,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date(r.createdAt).toISOString(),
    completedAt: r.completedAt ? (typeof r.completedAt === "string" ? r.completedAt : new Date(r.completedAt).toISOString()) : null,
  };
}

export function ReminderProvider({ children }: { children: ReactNode }) {
  // ✅ Start empty: DB is source of truth
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [areas, setAreas] = useState<AreaDefinition[]>([]);

  const [authRequired, setAuthRequired] = useState(false);


  const [settings, setSettingsState] = useState<ReminderSettings>({
    autoDeleteCompletedAfterDays: 7,
  });

  const [view, setView] = useState<View>("today");

  const [filters, updateFilters] = useState<Filters>({
    area: "all",
    status: "pending",
    priority: "all",
  });

  const refetchReminders = useCallback(async () => {
    const res = await fetch("/api/reminders", { cache: "no-store" });
    if (res.status === 401) {
      // not signed in yet — don't spam console
      setReminders([]);
      return;
    }
    
    if (!res.ok) {
      console.error("Failed to fetch reminders", res.status);
      return;
    }
    const data = await res.json();
    const normalized = (data.reminders ?? []).map(normalizeReminder);
    setReminders(applyAutoDelete(normalized, settings.autoDeleteCompletedAfterDays));
  }, [settings.autoDeleteCompletedAfterDays]);

  // ✅ Load from DB on first mount
  useEffect(() => {
    refetchReminders();
  }, [refetchReminders]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/areas", { cache: "no-store" });

      if (res.status === 401) {
        setAreas([]);
        return;
      }

      if (!res.ok) {
        console.error("Failed to fetch areas", res.status);
        return;
      }

      const data = await res.json().catch(() => null);
      setAreas(data?.areas ?? []);
    })();
  }, []);


  const addReminder = useCallback(
    async (input: ReminderInput) => {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.title,
          note: input.note ?? null,
  
          // IMPORTANT: this must be an Area.id or null
          areaId: input.areaId ?? null,
  
          dueAt: input.dueAt,
          frequency: input.frequency,
          priority: input.priority,
          status: input.status ?? "pending",
        }),
      });

      if (res.status === 401) {
        setAuthRequired(true);
        return;
      }
  
      const data = await res.json().catch(() => null);
  
      if (!res.ok) {
        console.error("Failed to create reminder", res.status, data);
        return;
      }
  
      // ✅ Support both possible API response shapes:
      const payload = data?.reminder ?? data;
  
      if (!payload?.id) {
        console.error("Create reminder: unexpected payload", data);
        return;
      }
  
      const created = normalizeReminder(payload);
  
      setReminders((prev) =>
        applyAutoDelete([created, ...prev], settings.autoDeleteCompletedAfterDays)
      );
    },
    [settings.autoDeleteCompletedAfterDays]
  );
  
  const updateReminderTitle = useCallback(
    async (id: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
  
      // optimistic
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, title: trimmed } : r)));
  
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
  
      if (!res.ok) {
        await refetchReminders();
        return;
      }
  
      const data = await res.json().catch(() => null);
      if (data?.reminder) {
        const updated = normalizeReminder(data.reminder);
        setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
      }
    },
    [refetchReminders]
  );


  const updateReminderDueAt = useCallback(
    async (id: string, dueAt: string, hasTime: boolean) => {
      // optimistic
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, dueAt, hasTime } : r))
      );
  
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueAt, hasTime }),
      });
  
      if (!res.ok) {
        await refetchReminders();
        return;
      }
  
      const data = await res.json().catch(() => null);
      if (data?.reminder) {
        const updated = normalizeReminder(data.reminder);
        setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
      }
    },
    [refetchReminders]
  );
  

  const toggleReminderStatus = useCallback(
    async (id: string) => {
      // optimistic update
      setReminders((prev) => {
        const nowIso = new Date().toISOString();
        const updated = prev.map((r) => {
          if (r.id !== id) return r;
          const nextStatus = r.status === "done" ? "pending" : "done";
          return {
            ...r,
            status: nextStatus,
            completedAt: nextStatus === "done" ? nowIso : null,
          };
        });
        return applyAutoDelete(updated, settings.autoDeleteCompletedAfterDays);
      });

      const res = await fetch(`/api/reminders/${id}`, { method: "PATCH" });
      if (!res.ok) {
        // fallback to server truth
        await refetchReminders();
      } else {
        const data = await res.json();
        if (data?.reminder) {
          const updated = normalizeReminder(data.reminder);
          setReminders((prev) => {
            const merged = prev.map((r) => (r.id === id ? updated : r));
            return applyAutoDelete(merged, settings.autoDeleteCompletedAfterDays);
          });
        }
      }
    },
    [refetchReminders, settings.autoDeleteCompletedAfterDays]
  );


  const moveReminder = useCallback(
    async (id: string, areaId: string | null) => {
      // optimistic update
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, areaId } : r))
      );
  
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaId }), // ✅ triggers move mode
      });
  
      if (!res.ok) {
        // fallback to server truth
        await refetchReminders();
        return;
      }
  
      const data = await res.json().catch(() => null);
      if (data?.reminder) {
        const updated = normalizeReminder(data.reminder);
        setReminders((prev) =>
          prev.map((r) => (r.id === id ? updated : r))
        );
      }
    },
    [refetchReminders]
  );
  


  const deleteReminder = useCallback(
    async (id: string) => {
      // optimistic
      const snapshot = reminders;
      setReminders((prev) => prev.filter((r) => r.id !== id));

      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
      console.error("Failed to delete reminder", res.status, text);
      setReminders(snapshot);
      }
    },
    [reminders]
  );

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

  // UI-only areas for now
  const addArea = useCallback(async (label: string): Promise<Area> => {
    const trimmed = label.trim();
    if (!trimmed) return "other";
  
    const res = await fetch("/api/areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: trimmed }),
    });

    if (res.status === 401) {
      setAuthRequired(true);
      return "other";
    }

  
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error("Failed to create area", res.status, text);
      return "other";
    }
  
    const data = await res.json();
    const created = data.area as AreaDefinition;
  
    setAreas((prev) => [...prev, created]);
    return created.id;
  }, []);
  

  const setSettings = useCallback(
    (updater: (prev: ReminderSettings) => ReminderSettings) => {
      setSettingsState((prev) => {
        const next = updater(prev);
        // re-apply cleanup with new setting
        setReminders((current) =>
          applyAutoDelete(current, next.autoDeleteCompletedAfterDays)
        );
        return next;
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      reminders,
      areas,
      settings,
      addReminder,
      toggleReminderStatus,
      updateReminderTitle,
      updateReminderDueAt,
      moveReminder,
      deleteReminder,
      addArea,
      setSettings,
      view,
      setView,
      filters,
      setFilters,
      setAreaFilter,
      refetchReminders,
      authRequired,
      setAuthRequired,
    }),
    [
      reminders,
      areas,
      settings,
      addReminder,
      toggleReminderStatus,
      updateReminderTitle,
      updateReminderDueAt,
      moveReminder,
      deleteReminder,
      addArea,
      setSettings,
      view,
      setView,
      filters,
      setFilters,
      setAreaFilter,
      refetchReminders,

      authRequired,
      setAuthRequired,
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
  if (!ctx) throw new Error("useReminderStore must be used within ReminderProvider");
  return ctx;
}
