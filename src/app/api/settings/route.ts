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
    
    // Safety check for data values
    const officeLat = parseFloat(data.officeLat) || 24.7136;
    const officeLng = parseFloat(data.officeLng) || 46.6753;
    const maxDistance = parseInt(data.maxDistance) || 500;
    const bellUrl = data.bellUrl || "https://assets.mixkit.co/active_storage/sfx/2855/2855-preview.mp3";
    const webhookUrl = data.webhookUrl || "";

    // Find any existing settings (we only have one row)
    // @ts-ignore
    let settings = await prisma.settings.findFirst();

    if (settings) {
      // @ts-ignore
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          officeLat,
          officeLng,
          maxDistance,
          bellUrl,
          webhookUrl,
        },
      });
    } else {
      // @ts-ignore
      settings = await prisma.settings.create({
        data: {
          id: 1,
          officeLat,
          officeLng,
          maxDistance,
          bellUrl,
          webhookUrl,
        },
      });
    }
    
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Settings PATCH Error:", error);
    // Include the error message in the response for better debugging in the UI
    return NextResponse.json({ 
      error: "فشل تحديث الإعدادات", 
      details: error.message 
    }, { status: 500 });
  }
}
