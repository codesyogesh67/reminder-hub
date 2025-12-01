📘 Reminder Hub

A modern, minimal, daily reminder system built with Next.js + shadcn/ui.

Reminder Hub is a clean, fast, and personal “daily system” app that helps you stay organized.
Capture reminders instantly, organize them into custom areas, filter by views, and plan your day with clarity.

Designed for both desktop & mobile — with a dynamic sidebar, quick-add bar, and beautiful cards powered by shadcn/ui.

✨ Features
🧠 Smart Reminders

Add reminders via Quick Add (press Enter)

Full “New Reminder” dialog with:

Title, note

Area selection

Due date

Frequency (once/daily/weekly/monthly/custom)

Priority (low/medium/high)

🗂 Custom Areas

Built-in areas (Health, Coding, Family, Money, Other)

Create your own custom areas from the sidebar (e.g., “Work”, “Gym”, “Finance”, “Travel”, etc.)

Areas persist during session (DB coming soon)

🔎 Smart Views

Today — reminders due today

Upcoming — anything due in the future

All reminders — full overview

Combine views with filters:

Status: pending / done / snoozed

Priority: low / medium / high

📱 Mobile-Ready UI

Beautiful mobile layout

Left slide-in drawer using shadcn Sheet

Quick area switching + add area from mobile

💅 Beautiful UI (shadcn/ui)

Dialog

Input

Button

Sheet

Select

Date picker (optional)

All styled with Tailwind + dark UI

🧱 Tech Stack
Layer	Tech
Frontend	Next.js 14, React Server Components
Styling	Tailwind CSS, shadcn/ui
State	Custom React Context Store (ReminderProvider)
Icons	lucide-react
Future DB	PostgreSQL + Prisma (coming soon)

📁 Project Structure

app/
  layout.tsx
  page.tsx
  globals.css

components/
  layout/
    navbar.tsx
    sidebar.tsx
    mobile-sidebar.tsx
  reminders/
    reminder-card.tsx
    filter-pill-group.tsx
    new-reminder-dialog.tsx
    reminder-store.tsx

lib/
  reminder.ts
