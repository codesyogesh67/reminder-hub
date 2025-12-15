// prisma/seed.ts
import { prisma } from "../lib/db";

async function main() {
  const userId = "demo-user";

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: "demo@example.com",
    },
  });

  const existing = await prisma.area.findMany({ where: { userId } });

  if (existing.length === 0) {
    await prisma.area.createMany({
      data: [
        { name: "Health", userId },
        { name: "Coding", userId },
        { name: "Family", userId },
        { name: "Money", userId },
        { name: "Other", userId },
      ],
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
