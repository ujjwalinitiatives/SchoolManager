import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChangePasswordForm } from "./change-password-form";
import { SchoolAddressForm } from "./school-address-form";

export default async function ProfileSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { school: true }
  });

  return (
    <main className="mx-auto w-full max-w-3xl py-10 px-5 sm:px-8">
      <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Profile Settings</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Manage your account security and personal information.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Change Password</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Update your password to keep your account secure.
          </p>
        </div>
        
        <ChangePasswordForm />
      </section>

      {user?.role === "PRINCIPAL" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 shadow-sm p-6 sm:p-8 mt-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">School Details</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Update your school's physical address for invoices and reports.
            </p>
          </div>
          <SchoolAddressForm initialAddress={user.school?.address || null} />
        </section>
      )}
    </main>
  );
}
