import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ArrowRight, CheckCircle2, Shield, Users, CreditCard, LayoutDashboard, Mail } from "lucide-react";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-premium overflow-hidden">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-white/20 glass">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
              <span className="font-bold text-sm sm:text-lg">SM</span>
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">SchoolManager</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-slate-900 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800 transition-all dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative pt-24 pb-16 sm:pt-40 sm:pb-24">
        {/* Background decorative elements */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] sm:w-[800px] h-[300px] sm:h-[400px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none -z-10 animate-float" />

        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/50 dark:border-blue-500/30 dark:bg-blue-500/10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 backdrop-blur-sm mb-6 sm:mb-8 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            Next Generation School Administration
          </div>
          
          <h1 className="mx-auto max-w-4xl text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-5 sm:mb-8">
            Manage your school with{" "}
            <span className="text-gradient block mt-1 sm:mt-2">absolute precision.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-8 sm:mb-10 leading-relaxed px-2">
            A unified operating system for educational institutions. Handle admissions, fees, billing, and parent communication in one beautifully designed platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <Link
              href="/signup"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-3.5 sm:py-4 text-base font-bold text-white shadow-xl shadow-blue-500/25 hover:bg-blue-700 hover:scale-105 transition-all"
            >
              Start for free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-8 py-3.5 sm:py-4 text-base font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all backdrop-blur-sm"
            >
              Book a Demo
            </Link>
          </div>
        </section>

        {/* UI Showcase Section */}
        <section className="mx-auto max-w-5xl px-6 mt-24 mb-10 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">Platform Overview</h2>

          <div className="flex flex-col gap-16">
            {/* Dashboard Preview Block */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-6 sm:p-10 backdrop-blur-sm shadow-xl relative overflow-hidden text-left">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Principal Dashboard</h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    The Principal Dashboard provides a comprehensive overview of school operations. Administrators can instantly access student records, monitor active classes, and oversee fee structures—all from a centralized, highly responsive interface designed to streamline daily workflows.
                  </p>
                </div>
                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-slate-50 dark:bg-slate-900">
                  <Image src="/ui-screenshots/dashboard_final.png" alt="Dashboard Preview" fill className="object-cover hover:scale-[1.02] transition-transform duration-500" />
                </div>
              </div>
            </div>

            {/* Students Preview Block */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-6 sm:p-10 backdrop-blur-sm shadow-xl relative overflow-hidden text-left">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-emerald-500" />
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Comprehensive Student Management</h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    Easily manage your student directory, handle admissions, and organize classes. Our streamlined workflows allow you to seamlessly add new students, link parent details, and automatically assign accurate fee structures.
                  </p>
                </div>
                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-slate-50 dark:bg-slate-900">
                  <Image src="/ui-screenshots/students_final.png" alt="Student Management Preview" fill className="object-cover hover:scale-[1.02] transition-transform duration-500" />
                </div>
              </div>
            </div>

            {/* PDF Preview Block */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-6 sm:p-10 backdrop-blur-sm shadow-xl relative overflow-hidden text-left">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Automated PDF Generation</h3>
                  <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    Generate professional, beautifully formatted PDF receipts and invoices with a single click. Every document is automatically branded with your school's name and details, ready to be printed or downloaded for physical record keeping and compliance.
                  </p>
                </div>
                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-800">
                  <Image src="/ui-screenshots/pdf_final.png" alt="PDF Export Preview" fill className="object-cover hover:scale-[1.02] transition-transform duration-500" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 mt-20 sm:mt-32">
          <div className="glass-card p-6 sm:p-10 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 sm:divide-x sm:divide-slate-100 sm:dark:divide-slate-800">
            {[
              { label: "Active Schools", value: "500+" },
              { label: "Transactions Processed", value: "₹2Cr+" },
              { label: "Students Managed", value: "100k+" },
              { label: "Uptime SLA", value: "99.9%" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center text-center px-2 sm:px-4">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-1 sm:mb-2">{stat.value}</span>
                <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-20 sm:mt-32">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">Everything you need to run your school</h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">Purpose-built tools for every administrative role.</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            {[
              {
                icon: <LayoutDashboard className="h-6 w-6 text-blue-600" />,
                title: "Unified Dashboard",
                desc: "Real-time insights into student enrollment, outstanding fees, and daily revenue collection."
              },
              {
                icon: <CreditCard className="h-6 w-6 text-indigo-600" />,
                title: "Smart Billing Engine",
                desc: "Automated invoice generation, receipt tracking, and multi-gateway online payment support."
              },
              {
                icon: <Users className="h-6 w-6 text-emerald-600" />,
                title: "Role-Based Portals",
                desc: "Dedicated interfaces for Principals, Accountants, Teachers, and Parents ensuring secure access."
              }
            ].map((feature, i) => (
              <div key={i} className="glass-card p-6 sm:p-8 hover:-translate-y-1 transition-transform duration-300">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4 sm:mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-7xl px-6 mt-32 mb-20">
          <div className="rounded-3xl bg-slate-900 p-10 sm:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl pointer-events-none" />
            
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-center gap-1 mb-8 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-6 w-6 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-2xl sm:text-3xl font-medium leading-tight mb-8">
                "Switching to SchoolManager transformed how we handle our finances. What used to take our accounting team weeks is now fully automated."
              </blockquote>
              <div className="flex items-center justify-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-800" />
                <div className="text-left">
                  <div className="font-bold text-white">Sarah Jenkins</div>
                  <div className="text-slate-400 text-sm">Principal, Oakridge Academy</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-lg py-12 text-center">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-[11px] font-bold text-white flex items-center justify-center shadow-md">SM</div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">SchoolManager</span>
          </div>
          
          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Link href="#about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About Us</Link>
            <a href="mailto:ujjwalkumar77890@gmail.com" className="group flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                <Mail className="h-4 w-4" />
              </span>
              <span>Reach Out: ujjwalkumar77890@gmail.com</span>
            </a>
          </nav>

          <div className="mt-4 w-full max-w-md border-t border-slate-200 dark:border-slate-800 pt-6">
            <p className="text-sm text-slate-500 dark:text-slate-500">
              © {new Date().getFullYear()} SchoolManager. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
