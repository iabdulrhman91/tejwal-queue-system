import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNextQueueNumber, checkPhoneRegistration } from "@/lib/queue-helpers";

export const dynamic = "force-dynamic";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const φ1 = rad(lat1),
    φ2 = rad(lat2);
  const Δφ = rad(lat2 - lat1),
    Δλ = rad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: Request) {
  try {
    const { name, phone, latitude, longitude } = await req.json();

    if (!name || !phone || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    // Fetch dynamic settings from DB
    // @ts-ignore
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = { 
        officeLat: 24.7136, 
        officeLng: 46.6753, 
        maxDistance: 500,
        webhookUrl: "" 
      } as any;
    }

    const OFFICE_LAT = settings?.officeLat || 24.7136;
    const OFFICE_LNG = settings?.officeLng || 46.6753;
    const MAX_DISTANCE = settings?.maxDistance || 500;

    // Is registration open?
    if (settings && (settings.isOpen === false || (settings.isOpen as any) == 0)) {
      return NextResponse.json({ error: "عذراً، التسجيل مغلق حالياً. سيفتح الرابط قبل الموعد بساعة واحدة مع ضرورة تواجدك في الموقع." }, { status: 403 });
    }

    // Is within office radius?
    const distance = getDistance(latitude, longitude, OFFICE_LAT, OFFICE_LNG);
    if (distance > MAX_DISTANCE) {
      return NextResponse.json(
        { error: `يجب أن تكون داخل نطاق المكتب للتسجيل (المسافة الحالية: ${Math.round(distance)} متر)` },
        { status: 403 }
      );
    }

    const existing = await checkPhoneRegistration(phone);
    if (existing) {
      return NextResponse.json(
        { error: "لديك تسجيل فعال بالفعل لهذا اليوم" },
        { status: 400 }
      );
    }

    const queueNumber = await generateNextQueueNumber();

    const item = await prisma.queueItem.create({
      data: {
        name,
        phone,
        queueNumber,
      },
    });

    // Webhook Trigger for Registration
    // @ts-ignore
    if (settings && settings.webhookUrl) {
      console.log(`[Webhook] Triggering Registration for: ${item.name} -> ${settings.webhookUrl}`);
      try {
        // Await the fetch to ensure it completes before sending the response
        await fetch(settings.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "CUSTOMER_REGISTERED",
            customer: {
              id: item.id,
              name: item.name,
              phone: item.phone,
              queueNumber: item.queueNumber,
              status: item.status,
              ticketUrl: `${new URL(req.url).origin}/ticket/${item.id}`
            },
            timestamp: new Date().toISOString()
          })
        });
        console.log("[Webhook] Sent successfully");
      } catch (e: any) {
        console.error("[Webhook] Call failed:", e.message);
      }
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
