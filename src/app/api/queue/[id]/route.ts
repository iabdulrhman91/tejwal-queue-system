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

    return NextResponse.json({ 
      ...item, 
      nowServing: nowServing?.queueNumber || "--",
      waitingCount 
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

    const updated = await prisma.queueItem.update({
      where: {
        id: parseInt(id),
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Webhook Trigger: If status is CALLED, check for webhook URL
    if (status === "CALLED") {
      try {
        // @ts-ignore
        const settings = await prisma.settings.findFirst();
        if (settings?.webhookUrl) {
          console.log("Triggering Webhook:", settings.webhookUrl);
          fetch(settings.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "CUSTOMER_CALLED",
              customer: {
                id: updated.id,
                name: updated.name,
                phone: updated.phone,
                queueNumber: updated.queueNumber,
                status: updated.status
              },
              timestamp: new Date().toISOString()
            })
          }).catch(err => console.error("Webhook Fetch Error:", err));
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
