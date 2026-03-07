import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // @ts-ignore
    let settings = await prisma.settings.findFirst();
    
    // Create default settings if they don't exist
    if (!settings) {
      // @ts-ignore
      settings = await prisma.settings.create({
        data: {
          id: 1,
          officeLat: 24.7136,
          officeLng: 46.6753,
          maxDistance: 500,
          bellUrl: "https://assets.mixkit.co/active_storage/sfx/2855/2855-preview.mp3",
          webhookUrl: ""
        }
      });
    }
    
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Settings GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const data = await req.json();
    // @ts-ignore
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        officeLat: parseFloat(data.officeLat),
        officeLng: parseFloat(data.officeLng),
        maxDistance: parseInt(data.maxDistance),
        bellUrl: data.bellUrl,
        webhookUrl: data.webhookUrl || "",
      },
      create: {
        id: 1,
        officeLat: parseFloat(data.officeLat),
        officeLng: parseFloat(data.officeLng),
        maxDistance: parseInt(data.maxDistance),
        bellUrl: data.bellUrl || "https://assets.mixkit.co/active_storage/sfx/2855/2855-preview.mp3",
        webhookUrl: data.webhookUrl || "",
      },
    });
    
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Settings PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
