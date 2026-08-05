import Link from "next/link";
import { redirect } from "next/navigation";

import { getParentInvoices, getSchoolInvoices, getStudentInvoices, getCurrentViewer } from "@/lib/invoice-access";
import { InvoicesClient } from "./invoices-client";

export default async function InvoicesPage() {
  const viewer = await getCurrentViewer();
  if (!viewer) redirect("/login");

  let invoices: any[] = [];
  let isParent = false;
  
  if (viewer.role === "PARENT") {
    const parentData = await getParentInvoices();
    invoices = parentData.invoices;
    isParent = true;
  } else if (viewer.role === "STUDENT") {
    const studentData = await getStudentInvoices();
    invoices = studentData.invoices;
  } else if (viewer.role === "PRINCIPAL" || viewer.role === "ACCOUNTANT") {
    const schoolData = await getSchoolInvoices();
    invoices = schoolData.invoices;
  } else {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-blue-700">
          {isParent ? "PARENT PORTAL" : "FINANCE & BILLING"}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">
          {isParent ? "Your child's invoices" : "All Invoices"}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {isParent 
            ? "Review fee invoices and download a printable PDF whenever needed." 
            : "View all fee invoices generated across the school."}
        </p>
      </header>
      <InvoicesClient invoices={invoices} isParent={isParent} />
    </main>
  );
}
