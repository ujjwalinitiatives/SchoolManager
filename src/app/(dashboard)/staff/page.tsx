import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddStaffForm } from "./add-staff-form";
import { RemoveStaffButton } from "./remove-staff-button";

export default async function StaffPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) redirect("/login");

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true },
  });
  if (!viewer) redirect("/login");

  const isPrincipal = viewer.role === "PRINCIPAL";

  if (!isPrincipal) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center py-20 px-5">
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="mt-3 text-slate-600">Only the Principal can manage staff members.</p>
      </main>
    );
  }

  const staffMembers = await prisma.user.findMany({
    where: { 
      schoolId: viewer.schoolId as string,
      role: { not: "STUDENT" }
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      teacherClasses: { select: { name: true, section: true } },
    },
  });

  const roleColors: Record<string, string> = {
    PRINCIPAL: "bg-blue-100 text-blue-800",
    ACCOUNTANT: "bg-emerald-100 text-emerald-800",
    TEACHER: "bg-amber-100 text-amber-800",
    PARENT: "bg-violet-100 text-violet-800",
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-blue-700">ADMINISTRATION</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">Staff & Members</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Manage teachers, accountants, and parent accounts.</p>
      </header>

      {/* Add Staff Form */}
      {viewer.role === "PRINCIPAL" && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <AddStaffForm />
        </div>
      )}

      {/* Staff List */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden sm:grid grid-cols-[1.5fr_1.5fr_0.8fr_1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-bold tracking-wide text-slate-500 uppercase">
          <span>Name</span><span>Email</span><span>Role</span><span>Info</span><span></span>
        </div>
        {staffMembers.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No staff members found.</div>
        ) : (
          staffMembers.map((member: typeof staffMembers[number]) => (
            <div key={member.id} className="grid gap-2 border-b border-slate-100 px-6 py-4 last:border-0 sm:grid-cols-[1.5fr_1.5fr_0.8fr_1fr_auto] sm:items-center">
              <div>
                <p className="font-semibold text-slate-900">{member.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 break-all">{member.email}</p>
              </div>
              <div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${roleColors[member.role] || "bg-slate-100 text-slate-700"}`}>
                  {member.role}
                </span>
              </div>
              <div>
                {member.role === "TEACHER" && member.teacherClasses.length > 0 ? (
                  <p className="text-sm text-slate-500">
                    {member.teacherClasses.map((c: { name: string; section: string }) => `${c.name}-${c.section}`).join(", ")}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">—</p>
                )}
              </div>
              <div>
                {member.id !== viewer.id && (
                  <RemoveStaffButton memberId={member.id} memberName={member.name} />
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
