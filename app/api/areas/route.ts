import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEMO_USER_ID = "demo-user";

export async function GET() {
  const areas = await prisma.area.findMany({
    where: { userId: DEMO_USER_ID },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    areas: areas.map((a) => ({ id: a.id, label: a.name })),
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const label = String(body?.label ?? "").trim();

  if (!label) {
    return NextResponse.json({ error: "Label required" }, { status: 400 });
  }

  const area = await prisma.area.create({
    data: { name: label, userId: DEMO_USER_ID },
  });

  return NextResponse.json(
    { area: { id: area.id, label: area.name } },
    { status: 201 }
  );
}
