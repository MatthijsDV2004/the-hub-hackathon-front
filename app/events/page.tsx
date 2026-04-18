import Link from "next/link";

const events = [
  {
    name: "Fresh Produce Pop-Up",
    start: "Tuesday 1:00 PM",
    end: "Tuesday 3:00 PM",
    seats: "30",
  },
  {
    name: "Protein Pantry Refill",
    start: "Thursday 11:30 AM",
    end: "Thursday 1:30 PM",
    seats: "40",
  },
  {
    name: "Weekend Grab-and-Go",
    start: "Friday 4:00 PM",
    end: "Friday 6:00 PM",
    seats: "50",
  },
];

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <main className="mx-auto w-full max-w-5xl space-y-5 rounded-3xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl md:p-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
              Student Events
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-4xl">
              Events + Peak Hour Queue
            </h1>
            <p className="mt-2 text-sm text-slate-300 md:text-base">
              Subscribe to Hub events and check expected traffic before you arrive.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-xs">
            <Link href="/" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-emerald-300/60">
              Home
            </Link>
            <Link href="/checkin" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-emerald-300/60">
              Queue Check-In
            </Link>
            <Link href="/admin/events" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-emerald-300/60">
              Admin Events
            </Link>
          </nav>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <article key={event.name} className="rounded-xl border border-white/10 bg-slate-950/45 p-4">
              <h2 className="text-base font-semibold text-white">{event.name}</h2>
              <p className="mt-2 text-sm text-slate-300">{event.start}</p>
              <p className="text-sm text-slate-300">Ends {event.end}</p>
              <p className="mt-2 text-sm text-emerald-200">Capacity: {event.seats}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
