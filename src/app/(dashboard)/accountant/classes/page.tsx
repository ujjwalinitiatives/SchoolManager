import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountantClassesClient } from "./accountant-classes-client";

export default async function AccountantClassesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true },
  });
  if (!viewer) redirect("/login");

  if (!["PRINCIPAL", "ACCOUNTANT"].includes(viewer.role)) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center py-20 px-5">
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
      </main>
    );
  }

  // Fetch all classes that have students and their enrollments with fee data
  const classes = await prisma.class.findMany({
    where: { 
      schoolId: viewer.schoolId as string,
    },
    include: {
      enrollments: {
        where: { student: { isActive: true } },
        include: {
          student: {
            include: {
              invoices: {
                where: { status: "OVERDUE" }
              }
            }
          }
        }
      }
    },
    orderBy: [{ name: "asc" }, { section: "asc" }]
  });

  const formattedClasses = classes.map((cls) => {
    return {
      id: cls.id,
      name: cls.name,
      section: cls.section,
      students: cls.enrollments.map((enr) => {
        const student = enr.student;
        const totalDue = student.invoices.reduce((acc, inv) => acc + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0);
        return {
          id: student.id,
          name: student.name,
          admissionNumber: student.admissionNumber,
          totalDue
        };
      }).sort((a, b) => a.name.localeCompare(b.name))
    };
  }).filter((cls) => cls.students.length > 0);

  const isPrincipal = viewer.role === "PRINCIPAL";

  return <AccountantClassesClient classes={formattedClasses} isPrincipal={isPrincipal} />;
}
