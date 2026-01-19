import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  console.log("✅ Clerk webhook hit", new Date().toISOString());
  const payload = await req.text();
  const headerList = await headers();

  const svix_id = headerList.get("svix-id") ?? "";
  const svix_timestamp = headerList.get("svix-timestamp") ?? "";
  const svix_signature = headerList.get("svix-signature") ?? "";

  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing CLERK_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  let evt: any;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = evt;

  // Create user when a new Clerk user is created
  if (type === "user.created") {
    const clerkId = data.id as string;

    const email =
      data.email_addresses?.find(
        (e: any) => e.id === data.primary_email_address_id
      )?.email_address ??
      data.email_addresses?.[0]?.email_address ??
      null;

    console.log("🔔 user.created received", { clerkId, email });

    try {
      await prisma.user.upsert({
        where: { id: clerkId },
        update: {
          email,
          // can be null because schema is String?
        },
        create: {
          id: clerkId,
          email, // can be null
        },
      });

      console.log("✅ DB upsert ok", { clerkId });
    } catch (e) {
      console.error("❌ DB upsert failed", e);
      return NextResponse.json({ error: "DB upsert failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
