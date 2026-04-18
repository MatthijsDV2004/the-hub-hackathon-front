import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_20%,rgba(56,189,248,0.2),transparent_30%),radial-gradient(circle_at_100%_90%,rgba(16,185,129,0.25),transparent_35%),linear-gradient(140deg,#020617,#0f172a_45%,#1e293b)]" />
      <main className="relative z-10 w-full max-w-4xl rounded-3xl border border-white/15 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-10">
        <p className="mb-4 inline-flex rounded-full border border-cyan-300/40 bg-cyan-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">
          The Hub Hackathon
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
          Real-time grocery visibility for students before they arrive at The Hub
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-200 md:text-lg">
          Staff can upload shelf photos, Gemini identifies products and estimated counts, and
          your team gets a structured inventory snapshot to share with students.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <h2 className="text-sm font-semibold text-white">Donation Flow</h2>
            <p className="mt-2 text-sm text-slate-300">
              Track items delivered from local partners like Trader Joe&apos;s and Target.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <h2 className="text-sm font-semibold text-white">Inventory Estimation</h2>
            <p className="mt-2 text-sm text-slate-300">
              Parse photos to estimate item names, package details, and available quantity.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <h2 className="text-sm font-semibold text-white">Student Access</h2>
            <p className="mt-2 text-sm text-slate-300">
              Publish what is in stock so students can plan around item limits.
            </p>
          </article>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/inventory"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-300 via-emerald-300 to-lime-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] hover:brightness-105"
          >
            Open Inventory Tracker
          </Link>
          <p className="inline-flex items-center text-sm text-slate-300">
            Powered by Gemini 2.5 Flash + Vercel environment variables
          </p>
        </div>
      </main>
    </div>
  );
}
