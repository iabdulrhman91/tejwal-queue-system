import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const item = await prisma.queueItem.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!item) {
      return NextResponse.json({ error: "الرقم غير موجود" }, { status: 404 });
    }

    const nowServing = await prisma.queueItem.findFirst({
      where: {
        createdAt: { gte: today },
        status: "CALLED",
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get currently waiting count before this item
    const waitingCount = await prisma.queueItem.count({
      where: {
        status: "WAITING",
        createdAt: {
          gte: today,
          lt: item.createdAt,
        },
      },
    });

    const totalToday = await prisma.queueItem.count({
      where: { createdAt: { gte: today } },
    });

    const doneToday = await prisma.queueItem.count({
      where: {
        createdAt: { gte: today },
        status: { in: ["DONE", "CALLED"] },
      },
    });

    return NextResponse.json({
      ...item,
      nowServing: nowServing?.queueNumber || "--",
      waitingCount,
      totalToday,
      doneToday,
    });
  } catch (error: any) {
    console.error("Queue Detail API Error:", error);
    return NextResponse.json({ error: error.message || "حدث خطأ في الخادم" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    // Check current status BEFORE updating
    const current = await prisma.queueItem.findUnique({
      where: { id: parseInt(id) },
    });

    const updated = await prisma.queueItem.update({
      where: {
        id: parseInt(id),
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Webhook only when status changes from WAITING to CALLED (not re-notify)
    if (status === "CALLED" && current?.status === "WAITING") {
      try {
        // @ts-ignore
        const settings = await prisma.settings.findFirst();
        if (settings?.webhookUrl) {
          console.log("Triggering Webhook:", settings.webhookUrl);
          // Get today's date
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Find the 6th person waiting in the queue
          const sixthInLine = await prisma.queueItem.findMany({
            where: {
              status: "WAITING",
              createdAt: { gte: today },
            },
            orderBy: { createdAt: "asc" },
            skip: 5,
            take: 1,
          });

          if (sixthInLine.length > 0) {
            const nextCustomer = sixthInLine[0];
            console.log(`[Webhook] Notifying 6th in line: ${nextCustomer.name} (${nextCustomer.queueNumber})`);
            fetch(settings.webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event: "CUSTOMER_UPCOMING",
                customer: {
                  id: nextCustomer.id,
                  name: nextCustomer.name,
                  phone: nextCustomer.phone,
                  queueNumber: nextCustomer.queueNumber,
                  status: nextCustomer.status,
                  ticketUrl: `${new URL(req.url).origin}/ticket/${nextCustomer.id}`
                },
                timestamp: new Date().toISOString()
              })
            }).catch(err => console.error("Webhook Fetch Error:", err));
          } else {
            console.log("[Webhook] No 6th person in queue to notify");
          }
        }
      } catch (webhookErr) {
        console.error("Webhook Trigger Error:", webhookErr);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ أثناء التحديث" }, { status: 500 });
  }
}
