import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEMO_USER_ID = "demo-user";

export async function GET() {
  const reminders = await prisma.reminder.findMany({
    where: { userId: DEMO_USER_ID },
    orderBy: { createdAt: "desc" },
    include: { area: true },
  });

  return NextResponse.json({ reminders });
}

export async function POST(req: Request) {
  const body = await req.json();

  // expected body:
  // { title, note?, areaId?, dueAt, frequency, priority, status? }
  const reminder = await prisma.reminder.create({
    data: {
      userId: DEMO_USER_ID,
      title: body.title,
      note: body.note ?? null,
      areaId: body.areaId ?? null,
      dueAt: new Date(body.dueAt),
      frequency: body.frequency,
      priority: body.priority,
      status: body.status ?? "pending",
      completedAt: body.status === "done" ? new Date() : null,
    },
  });

  return NextResponse.json({ reminder }, { status: 201 });
}
