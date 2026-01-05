import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// const DEMO_USER_ID = "demo-user";

export async function GET() {
  const { userId } = auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const reminders = await prisma.reminder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { area: true },
  });

  return NextResponse.json({
    reminders: reminders.map((r) => ({
      id: r.id,
      title: r.title,
      note: r.note ?? "",
      areaId: r.areaId ?? null,
      areaLabel: r.area?.name ?? null, // ✅ optional
      dueAt: r.dueAt,
      frequency: r.frequency,
      priority: r.priority,
      status: r.status,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
    })),
  });
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  // expected body:
  // { title, note?, areaId?, dueAt, frequency, priority, status? }
  const reminder = await prisma.reminder.create({
    data: {
      userId,
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
