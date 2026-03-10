import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Auto-Migration for Production: Add isOpen column if it doesn't exist
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE Settings ADD COLUMN isOpen INTEGER DEFAULT 1`);
      console.log("Migration: Added isOpen column to Settings table");
    } catch (e) {
      // Column likely already exists, ignore
    }

    // Standard Prisma call
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

    const tickerMessages = (process.env.TICKER_MESSAGES || process.env.NEXT_PUBLIC_TICKER_MESSAGES || "")
      .split(';')
      .map(s => s.trim())
      .filter(s => s !== "");

    const tickerSpeed = parseInt(process.env.TICKER_SPEED || process.env.NEXT_PUBLIC_TICKER_SPEED || "45");
    
    console.log("Debug - Ticker Messages from ENV:", tickerMessages);


    return NextResponse.json({
      ...settings,
      tickerMessages: tickerMessages.length > 0 ? tickerMessages : null,
      tickerSpeed: !isNaN(tickerSpeed) ? tickerSpeed : 45
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "Pragma": "no-cache"
      }
    });
  } catch (error: any) {
    console.error("Settings GET Error:", error);
    return NextResponse.json({ 
      error: "فشل استرجاع الإعدادات",
      details: error.message 
    }, { status: 500 });
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
