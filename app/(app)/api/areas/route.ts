import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

// const DEMO_USER_ID = "demo-user";

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const areas = await prisma.area.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    areas: areas.map((a) => ({ id: a.id, label: a.name })),
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  console.log("userid is here", userId);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const label = String(body?.label ?? "").trim();

  if (!label) {
    return NextResponse.json({ error: "Label required" }, { status: 400 });
  }

  const area = await prisma.area.create({
    data: { name: label, userId },
  });

  return NextResponse.json(
    { area: { id: area.id, label: area.name } },
    { status: 201 }
  );
}
