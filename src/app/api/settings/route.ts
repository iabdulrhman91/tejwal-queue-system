import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Standard Prisma call (Client is now in sync)
    // @ts-ignore
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      console.log("No settings found, creating defaults...");
      // @ts-ignore
      settings = await prisma.settings.create({
        data: {
          id: 1,
          officeLat: 24.7136,
          officeLng: 46.6753,
          maxDistance: 500,
          bellUrl: "https://assets.mixkit.co/active_storage/sfx/2855/2855-preview.mp3",
          webhookUrl: "",
          isOpen: true
        }
      });
    }
    
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Settings GET Error:", error);
    return NextResponse.json({ error: "فشل استرجاع الإعدادات" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const data = await req.json();
    console.log("PATCH settings request body:", JSON.stringify(data));
    
    const lat = isNaN(parseFloat(data.officeLat)) ? 24.7136 : parseFloat(data.officeLat);
    const lng = isNaN(parseFloat(data.officeLng)) ? 46.6753 : parseFloat(data.officeLng);
    const dist = isNaN(parseInt(data.maxDistance)) ? 500 : parseInt(data.maxDistance);
    const bell = data.bellUrl || "https://assets.mixkit.co/active_storage/sfx/2855/2855-preview.mp3";
    const web = data.webhookUrl || "";
    // Handle isOpen correctly
    const isOpen = data.isOpen === true || data.isOpen === 1 || data.isOpen === "true";

    // @ts-ignore
    let settings = await prisma.settings.findFirst();

    if (settings) {
      // @ts-ignore
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: { 
          officeLat: lat, 
          officeLng: lng, 
          maxDistance: dist, 
          bellUrl: bell, 
          webhookUrl: web, 
          isOpen 
        },
      });
    } else {
      // @ts-ignore
      settings = await prisma.settings.create({
        data: { 
          id: 1, 
          officeLat: lat, 
          officeLng: lng, 
          maxDistance: dist, 
          bellUrl: bell, 
          webhookUrl: web, 
          isOpen 
        },
      });
    }
    
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Settings PATCH Error:", error);
    return NextResponse.json({ 
      error: "فشل تحديث الإعدادات", 
      details: error.message 
    }, { status: 500 });
  }
}
