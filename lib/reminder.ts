// lib/reminder.ts
export type Frequency = "once" | "daily" | "weekly" | "monthly" | "custom";

export type Priority = "low" | "medium" | "high";
export type Status = "pending" | "done" | "snoozed";

// Area is now dynamic – can be any string id
export type Area = string;

export type Reminder = {
  id: string;
  title: string;
  note?: string;
  area: Area; // <-- just a string id
  dueAt: string; // ISO datetime
  frequency: Frequency;
  priority: Priority;
  status: Status;
  createdAt: string;
};

export type ReminderInput = Omit<Reminder, "id" | "createdAt" | "status"> & {
  status?: Status;
};
