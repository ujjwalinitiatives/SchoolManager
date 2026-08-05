import { redirect } from "next/navigation";

import { AccessDeniedError } from "@/lib/access-control";
import { getPrincipalGatewaySettings } from "@/lib/gateway-access";

import { activateGateway, createGateway, deactivateGateway, deleteGateway } from "./actions";
import { DirectUpiForm } from "./direct-upi-form";
import { prisma } from "@/lib/prisma";

const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default async function GatewaySettingsPage() {
  let settings;
  try {
    settings = await getPrincipalGatewaySettings();
  } catch (error) {
    if (error instanceof AccessDeniedError) redirect("/dashboard");
    throw error;
  }
  if (!settings) redirect("/login");

  const viewer = await prisma.user.findUnique({
    where: { id: settings.viewer.id },
    select: { school: { include: { bankAccounts: true } } }
  });
  const upiId = viewer?.school?.bankAccounts?.[0]?.upiId || null;

  return (
    <main className="mx-auto w-full max-w-5xl py-10 px-5 sm:px-8">
      <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
        <p className="text-sm font-semibold tracking-wide text-blue-700 dark:text-blue-500 uppercase">School Settings</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">Payment Gateways</h1>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
          Configure multiple payment providers. Credentials are encrypted before storage.
          Activate a gateway to start receiving payments through it.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-slate-900">Add a payment gateway</h2>
        <form action={createGateway} className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span>Provider name</span>
            <input name="providerName" required maxLength={50} placeholder="e.g. RAZORPAY" className="rounded-lg border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span>Environment</span>
            <select name="environment" className="rounded-lg border border-slate-300 px-3 py-2.5 bg-white">
              <option value="TEST">Test / Sandbox</option>
              <option value="PRODUCTION">Production</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span>API key</span>
            <input name="apiKey" required autoComplete="off" className="rounded-lg border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span>API secret</span>
            <input name="apiSecret" type="password" required autoComplete="new-password" className="rounded-lg border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span>Webhook secret <em className="font-normal text-slate-500">(optional)</em></span>
            <input name="webhookSecret" type="password" autoComplete="new-password" className="rounded-lg border border-slate-300 px-3 py-2.5" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span>Merchant ID <em className="font-normal text-slate-500">(optional)</em></span>
            <input name="merchantId" autoComplete="off" className="rounded-lg border border-slate-300 px-3 py-2.5" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Save encrypted gateway</button>
          </div>
        </form>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-bold text-slate-900">Direct UPI Collection (Google Pay / PhonePe)</h2>
        <p className="mt-1 text-sm text-slate-600 mb-4">
          Enable direct payments to your bank account without transaction fees by setting your UPI ID.
        </p>
        <DirectUpiForm initialUpiId={upiId} />
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-bold text-slate-900">Configured providers</h2>
          <p className="mt-1 text-sm text-slate-600">Secret values are intentionally never displayed. Only one provider can be active at a time.</p>
        </div>
        {settings.gateways.length === 0 ? (
          <p className="px-6 py-10 text-center text-slate-600">No payment gateways have been configured.</p>
        ) : (
          settings.gateways.map((gateway: NonNullable<typeof settings>["gateways"][number]) => (
            <article key={gateway.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 last:border-0">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-slate-900">{gateway.providerName}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    gateway.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {gateway.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">Added {dateTime.format(gateway.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                {gateway.isActive ? (
                  <form action={deactivateGateway.bind(null, gateway.id)}>
                    <button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      Deactivate
                    </button>
                  </form>
                ) : (
                  <>
                    <form action={activateGateway.bind(null, gateway.id)}>
                      <button type="submit" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                        Make active
                      </button>
                    </form>
                    <form action={deleteGateway.bind(null, gateway.id)}>
                      <button type="submit" className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                        Delete
                      </button>
                    </form>
                  </>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
