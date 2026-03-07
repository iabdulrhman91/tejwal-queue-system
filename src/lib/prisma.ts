import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Log environment status for debugging (server-side only)
if (typeof window === "undefined") {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ [Prisma] DATABASE_URL NOT SET. Falling back to local SQLite file.");
  }
}

// Standard fallback if DATABASE_URL is missing
const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // @ts-ignore - Bypass potential sync issues between schema and client
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
