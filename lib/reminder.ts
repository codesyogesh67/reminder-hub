// lib/reminder.ts
export type Frequency = "once" | "daily" | "weekly" | "monthly" | "custom";

export type Priority = "low" | "medium" | "high";
export type Status = "pending" | "done" | "snoozed";

// Area is free-form so users can add custom areas
export type Area = string;

export type Reminder = {
  id: string;
  title: string;
  note?: string;
  area: Area;
  dueAt: string; // ISO datetime
  frequency: Frequency;
  priority: Priority;
  status: Status;
  createdAt: string; // ISO datetime
  completedAt?: string | null; // when marked done (for auto-delete)
};

export type ReminderInput = Omit<
  Reminder,
  "id" | "createdAt" | "status" | "completedAt"
> & { status?: Status };
