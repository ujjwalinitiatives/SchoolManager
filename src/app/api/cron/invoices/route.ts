import { FeeFrequency } from "@prisma/client";
import { NextResponse } from "next/server";

import { generateInvoicesForCycle } from "@/lib/billing-engine";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

function scheduledFrequencies(sessionStartDate: Date, cycleDate: Date) {
  if (cycleDate.getUTCDate() !== 1) return [];

  const monthsSinceStart =
    (cycleDate.getUTCFullYear() - sessionStartDate.getUTCFullYear()) * 12 +
    cycleDate.getUTCMonth() -
    sessionStartDate.getUTCMonth();

  if (monthsSinceStart < 0) return [];

  const frequencies: FeeFrequency[] = [FeeFrequency.MONTHLY];
  if (monthsSinceStart % 3 === 0) frequencies.push(FeeFrequency.QUARTERLY);
  if (monthsSinceStart % 12 === 0) frequencies.push(FeeFrequency.ANNUAL);
  return frequencies;
}

/** Run daily by Vercel Cron; billing work is performed only on the first UTC day of each month. */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cycleDate = new Date();
  const activeSessions = await prisma.academicSession.findMany({
    where: { isActive: true, startDate: { lte: cycleDate }, endDate: { gte: cycleDate } },
    select: { id: true, schoolId: true, startDate: true },
  });
  const dueDate = new Date(cycleDate);
  dueDate.setUTCDate(dueDate.getUTCDate() + Number(process.env.INVOICE_DUE_DAYS ?? 15));

  const results = [];
  for (const session of activeSessions) {
    for (const frequency of scheduledFrequencies(session.startDate, cycleDate)) {
      results.push(
        await generateInvoicesForCycle({
          schoolId: session.schoolId,
          academicSessionId: session.id,
          cycleDate,
          dueDate,
          frequency,
        }),
      );
    }
  }

  return NextResponse.json({
    sessionsProcessed: activeSessions.length,
    invoicesCreated: results.reduce((total, result) => total + result.created, 0),
    invoicesSkipped: results.reduce((total, result) => total + result.skipped, 0),
  });
}