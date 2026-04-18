import Link from "next/link";

export default function CheckinPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <main className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl md:p-8">
        <p className="inline-flex rounded-full border border-lime-300/40 bg-lime-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-lime-100">
          Student Queue
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-4xl">
          Peak-Hour Check-In
        </h1>
        <p className="mt-3 text-sm text-slate-300 md:text-base">
          Students can join a queue for major Hub events so line management stays predictable during
          high-traffic windows.
        </p>

        <div className="mt-5 space-y-2 rounded-xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-200">
          <p>1. Select event timeslot.</p>
          <p>2. Confirm student ID and expected pickup window.</p>
          <p>3. Receive queue position and estimated wait time.</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <Link href="/events" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-lime-300/60">
            Back to Events
          </Link>
          <Link href="/" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-lime-300/60">
            Home
          </Link>
        </div>
      </main>
    </div>
  );
}
