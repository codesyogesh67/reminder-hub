"use client";

import { useMemo, useState, FormEvent } from "react";
import { useReminderStore } from "@/components/reminders/reminder-store";
import type { Frequency, Priority } from "@/lib/reminder";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const frequencyOptions: { value: Frequency; label: string }[] = [
  { value: "once", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
];

const priorityOptions: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function NewReminderDialog() {
  const { addReminder, filters, areas } = useReminderStore();
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  // ✅ areaId (DB id) not area slug
  const defaultAreaId = useMemo(() => {
    // if filter is "all", pick first area if available, else null
    if (filters.area === "all") return areas[0]?.id ?? null;
    return String(filters.area);
  }, [filters.area, areas]);

  const [areaId, setAreaId] = useState<string | null>(defaultAreaId);

  const [frequency, setFrequency] = useState<Frequency>("once");
  const [priority, setPriority] = useState<Priority>("medium");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");

  function resetForm() {
    setTitle("");
    setNote("");
    setAreaId(defaultAreaId);
    setFrequency("once");
    setPriority("medium");
    setDate("");
    setTime("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    // Build ISO datetime from date + time
    let due: Date;
    if (date) {
      const base = time || "09:00";
      due = new Date(`${date}T${base}`);
    } else {
      due = new Date();
    }

    await addReminder({
      title: title.trim(),
      note: note.trim() ? note.trim() : undefined,
      areaId, // ✅ send areaId
      frequency,
      priority,
      dueAt: due.toISOString(),
    });

    resetForm();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-100 hover:bg-slate-800"
        >
          + New
        </Button>
      </DialogTrigger>

      <DialogContent className="border-slate-800 bg-slate-950 text-slate-50 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            New reminder
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Capture a quick reminder and assign it to an area. You can refine
            the schedule later.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              autoFocus
              placeholder="Call parents, drink water, review expenses…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-900/60 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              rows={3}
              placeholder="Add any context or checklist for this reminder."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-slate-900/60 text-sm"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Area</Label>
              <Select
                value={areaId ?? ""}
                onValueChange={(value) => setAreaId(value || null)}
              >
                <SelectTrigger className="bg-slate-900/60 text-xs">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-950 text-xs">
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                  {areas.length === 0 && (
                    <div className="px-2 py-2 text-xs text-slate-500">
                      No areas yet. Create one from the sidebar.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select
                value={frequency}
                onValueChange={(value) => setFrequency(value as Frequency)}
              >
                <SelectTrigger className="bg-slate-900/60 text-xs">
                  <SelectValue placeholder="Once" />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-950 text-xs">
                  {frequencyOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as Priority)}
              >
                <SelectTrigger className="bg-slate-900/60 text-xs">
                  <SelectValue placeholder="Medium" />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-950 text-xs">
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-900/60 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-slate-900/60 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="text-xs text-slate-300 hover:bg-slate-900"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-sky-500 text-xs font-semibold text-slate-950 hover:bg-sky-400"
            >
              Save reminder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
