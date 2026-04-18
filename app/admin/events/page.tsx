import Link from "next/link";

export default function AdminEventsPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <main className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl md:p-8">
        <p className="inline-flex rounded-full border border-sky-300/40 bg-sky-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-100">
          Admin Events
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-4xl">
          Manage Events and Queue Rules
        </h1>
        <p className="mt-3 text-sm text-slate-300 md:text-base">
          Create event windows, set capacity, and monitor queue throughput during peak traffic.
        </p>

        <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-200">
          Recommended controls: event name, start/end time, max attendees, and queue cut-off rules.
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <Link href="/admin" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-sky-300/60">
            Admin Dashboard
          </Link>
          <Link href="/events" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-sky-300/60">
            Student Events Page
          </Link>
        </div>
      </main>
    </div>
  );
}
