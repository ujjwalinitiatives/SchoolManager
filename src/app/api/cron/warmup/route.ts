import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple health-check that keeps Neon DB connection warm
// Runs every 4 minutes via Vercel Cron to prevent cold starts
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Lightweight query to keep the DB connection alive
    await prisma.$queryRawUnsafe("SELECT 1");
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("DB warm-up failed:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
