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
    // @ts-ignore - Prisma 5 might need a reload in TS server
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      // Default to Riyadh if no settings record exists yet
      settings = { officeLat: 24.7136, officeLng: 46.6753, maxDistance: 500 } as any;
    }

    const OFFICE_LAT = settings?.officeLat || 24.7136;
    const OFFICE_LNG = settings?.officeLng || 46.6753;
    const MAX_DISTANCE = settings?.maxDistance || 500;

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

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
