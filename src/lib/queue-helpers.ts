import { prisma } from "@/lib/prisma";

export async function generateNextQueueNumber() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const countToday = await prisma.queueItem.count({
    where: {
      createdAt: {
        gte: today,
      },
    },
  });

  const nextCount = countToday + 1;
  const numPart = nextCount.toString().padStart(2, "0");
  return `A${numPart}`;
}

export async function checkPhoneRegistration(phone: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.queueItem.findFirst({
    where: {
      phone,
      createdAt: {
        gte: today,
      },
      status: {
        in: ["WAITING", "CALLED"],
      },
    },
  });

  return existing;
}
