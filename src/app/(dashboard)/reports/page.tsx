import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportsClient } from "./reports-client";
import { generateDailyReport } from "./actions";

export default async function ReportsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true },
  });
  if (!viewer) redirect("/login");

  const isPrincipalOrAccountant = ["PRINCIPAL", "ACCOUNTANT"].includes(viewer.role);
  if (!isPrincipalOrAccountant) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center py-20 px-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Access Denied</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">Only the Principal or Accountant can view reports.</p>
      </main>
    );
  }

  // Fetch all saved daily reports
  const reports = await prisma.reportDocument.findMany({
    where: { schoolId: viewer.schoolId as string },
    orderBy: { createdAt: 'desc' }
  });

  return <ReportsClient initialReports={reports} generateAction={generateDailyReport} />;
}
