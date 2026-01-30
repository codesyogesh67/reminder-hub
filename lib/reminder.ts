// lib/reminder.ts
export type Frequency = "once" | "daily" | "weekly" | "monthly" | "custom";

export type Priority = "low" | "medium" | "high";
export type Status = "pending" | "done" | "snoozed";

// Area is free-form so users can add custom areas
export type Area = string;

export type Reminder = {
  id: string;
  title: string;
  note: string;
  areaId: string | null; // ✅ normalized
  dueAt: string | null;
  hasTime: boolean;
  frequency: Frequency;
  priority: Priority;
  status: Status;
  createdAt: string;
  completedAt: string | null;
};

export type ReminderInput = {
  title: string;
  note?: string;
  areaId?: string | null; // ✅ normalized
  dueAt?: string;
  frequency: Frequency;
  priority: Priority;
  status?: Status;
};
