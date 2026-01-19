import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

const DEFAULT_AREA_NAME = "General";

export async function GET() {
  const { userId } = await auth();
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
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // normalize areaId
  const rawAreaId = typeof body.areaId === "string" ? body.areaId.trim() : "";
  const requestedAreaId = rawAreaId.length ? rawAreaId : null;

  let finalAreaId: string | null = null;

  if (requestedAreaId) {
    // ✅ verify area exists AND belongs to user
    const area = await prisma.area.findFirst({
      where: { id: requestedAreaId, userId },
      select: { id: true },
    });

    if (!area) {
      return NextResponse.json(
        { error: "Invalid areaId (not found or not yours)" },
        { status: 400 }
      );
    }

    finalAreaId = area.id;
  } else {
    // ✅ create/fetch default area for this user
    const defaultArea = await prisma.area.upsert({
      where: {
        userId_name: {
          userId,
          name: DEFAULT_AREA_NAME,
        },
      },
      update: {},
      create: {
        userId,
        name: DEFAULT_AREA_NAME,
      },
      select: { id: true },
    });

    finalAreaId = defaultArea.id;
  }

  const reminder = await prisma.reminder.create({
    data: {
      userId,
      title: body.title,
      note: body.note ?? null,
      areaId: finalAreaId, // ✅ always valid now
      dueAt: new Date(body.dueAt),
      hasTime: body.hasTime ?? false,
      frequency: body.frequency,
      priority: body.priority,
      status: body.status ?? "pending",
      completedAt: body.status === "done" ? new Date() : null,
    },
  });

  return NextResponse.json(reminder);
}
