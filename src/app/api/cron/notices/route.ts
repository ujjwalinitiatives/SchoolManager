import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function GET(req: Request) {
  try {
    // Only allow cron requests (if using vercel)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const fifteenDaysAgo = subDays(new Date(), 15);

    const deleted = await prisma.notice.deleteMany({
      where: {
        createdAt: {
          lt: fifteenDaysAgo
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${deleted.count} notices older than 15 days.`
    });
  } catch (error: any) {
    console.error("Cron Error (Notices):", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
