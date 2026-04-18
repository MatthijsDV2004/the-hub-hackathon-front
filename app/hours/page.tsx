import Link from "next/link";

const weeklyHours = [
  { day: "Monday", hours: "9:00 AM - 5:00 PM" },
  { day: "Tuesday", hours: "9:00 AM - 5:00 PM" },
  { day: "Wednesday", hours: "9:00 AM - 6:00 PM" },
  { day: "Thursday", hours: "9:00 AM - 5:00 PM" },
  { day: "Friday", hours: "9:00 AM - 3:00 PM" },
  { day: "Saturday", hours: "Closed" },
  { day: "Sunday", hours: "Closed" },
];

export default function HoursPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <main className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl md:p-8">
        <p className="inline-flex rounded-full border border-orange-300/40 bg-orange-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-100">
          Hub Info
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-4xl">
          Hours of Operation
        </h1>
        <p className="mt-3 text-sm text-slate-300 md:text-base">
          Students can check open hours and avoid peak congestion windows.
        </p>

        <section className="mt-5 rounded-xl border border-white/10 bg-slate-950/45 p-4">
          <p className="text-sm text-slate-300">Location: Student Union Basement, Room B18</p>
          <div className="mt-3 space-y-2">
            {weeklyHours.map((entry) => (
              <div key={entry.day} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm">
                <span className="font-medium text-slate-100">{entry.day}</span>
                <span className="text-slate-300">{entry.hours}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <Link href="/" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-orange-300/60">
            Home
          </Link>
          <Link href="/admin/hours" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-orange-300/60">
            Admin Hours Management
          </Link>
        </div>
      </main>
    </div>
  );
}
