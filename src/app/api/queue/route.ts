import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items = await prisma.queueItem.findMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Queue API Error:", error);
    return NextResponse.json({ error: error.message || "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // This will only delete items created today
    await prisma.queueItem.deleteMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    return NextResponse.json({ message: "تم تصفير اللوحة بنجاح" });
  } catch (error: any) {
    console.error("Queue Reset Error:", error);
    return NextResponse.json({ error: error.message || "حدث خطأ أثناء التصفير" }, { status: 500 });
  }
}
