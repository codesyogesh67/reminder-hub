// app/api/reminders/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// const DEMO_USER_ID = "demo-user";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, context: Ctx) {
  try {
    const { userId } = await auth();
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

    const detail =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : JSON.stringify(err);

    return NextResponse.json(
      { error: "Internal Server Error", detail },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: Ctx) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    // ✅ read body safely (PATCH might be called without body)
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }

    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // after parsing body + checking existing...

    if (body && Object.prototype.hasOwnProperty.call(body, "title")) {
      const rawTitle = typeof body.title === "string" ? body.title.trim() : "";
      if (!rawTitle) {
        return NextResponse.json({ error: "Title required" }, { status: 400 });
      }

      const updated = await prisma.reminder.update({
        where: { id },
        data: { title: rawTitle },
      });

      return NextResponse.json({ reminder: updated });
    }

    if (body && Object.prototype.hasOwnProperty.call(body, "dueAt")) {
      const raw = body.dueAt;
      const date = new Date(raw);

      if (Number.isNaN(date.getTime())) {
        return NextResponse.json({ error: "Invalid dueAt" }, { status: 400 });
      }

      const updated = await prisma.reminder.update({
        where: { id },
        data: {
          dueAt: date,
          hasTime: Boolean(body.hasTime),
        },
      });

      return NextResponse.json({ reminder: updated });
    }

    // -----------------------------
    // ✅ Mode A: Move area (if areaId provided)
    // -----------------------------
    if (body && Object.prototype.hasOwnProperty.call(body, "areaId")) {
      const rawAreaId =
        typeof body.areaId === "string" ? body.areaId.trim() : "";
      const nextAreaId = rawAreaId.length ? rawAreaId : null;

      // validate area belongs to user (unless null)
      if (nextAreaId) {
        const area = await prisma.area.findFirst({
          where: { id: nextAreaId, userId },
          select: { id: true },
        });

        if (!area) {
          return NextResponse.json(
            { error: "Invalid areaId (not found or not yours)" },
            { status: 400 }
          );
        }
      }

      const updated = await prisma.reminder.update({
        where: { id },
        data: { areaId: nextAreaId },
      });

      return NextResponse.json({ reminder: updated });
    }

    // -----------------------------
    // ✅ Mode B: Toggle status (default)
    // -----------------------------
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

    const detail =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : (() => {
            try {
              return JSON.stringify(err);
            } catch {
              return String(err);
            }
          })();

    return NextResponse.json(
      { error: "Internal Server Error", detail },
      { status: 500 }
    );
  }
}
