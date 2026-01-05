// app/api/reminders/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// const DEMO_USER_ID = "demo-user";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, context: Ctx) {
  try {
    const { userId } = auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;

    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.reminder.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/reminders/[id] failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

export async function PATCH(_req: Request, context: Ctx) {
  try {
    const { userId } = auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;

    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const nextStatus = existing.status === "done" ? "pending" : "done";

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        status: nextStatus,
        completedAt: nextStatus === "done" ? new Date() : null,
      },
    });

    return NextResponse.json({ reminder: updated });
  } catch (err) {
    console.error("PATCH /api/reminders/[id] failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
