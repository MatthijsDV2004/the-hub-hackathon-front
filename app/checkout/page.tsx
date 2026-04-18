import Link from "next/link";

const checkoutSteps = [
  "Student places selected items on checkout table.",
  "Admin captures a table photo from this route.",
  "AI identifies items and quantity picked up.",
  "System decrements inventory from shelf counts.",
];

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <main className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl md:p-8">
        <p className="inline-flex rounded-full border border-rose-300/40 bg-rose-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-rose-100">
          Admin Checkout
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-4xl">
          Checkout Photo Scanner
        </h1>
        <p className="mt-3 text-sm text-slate-300 md:text-base">
          Scan checkout table photos to automatically decrement stock and reduce manual recounts.
        </p>

        <section className="mt-5 grid gap-2 rounded-xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-200">
          {checkoutSteps.map((step) => (
            <p key={step} className="rounded-lg border border-white/10 px-3 py-2">
              {step}
            </p>
          ))}
        </section>

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <Link href="/admin" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-rose-300/60">
            Admin Dashboard
          </Link>
          <Link href="/inventory" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-rose-300/60">
            AI Inventory Upload
          </Link>
        </div>
      </main>
    </div>
  );
}
