import Link from "next/link";

const studentLinks = [
  { href: "/student/inventory", label: "Inventory" },
  { href: "/hours", label: "Hours" },
  { href: "/events", label: "Events" },
  { href: "/checkin", label: "Queue Check-In" },
];

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/inventory", label: "AI Inventory Upload" },
  { href: "/admin/stock", label: "Manual Stock Edit" },
  { href: "/checkout", label: "Checkout Scanner" },
  { href: "/admin/hours", label: "Manage Hours" },
  { href: "/admin/events", label: "Manage Events" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 text-slate-900 md:px-8">
      <main className="mx-auto w-full max-w-4xl">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
            The Hub
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Basic Needs Hub Inventory
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-700 md:text-base">
            Students can check current groceries before arriving. Staff can upload photos,
            review AI results, and manage inventory, hours, checkout updates, and events.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/login"
              className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            >
              Login
            </Link>
            <Link
              href="/student/inventory"
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Student Inventory
            </Link>
            <Link
              href="/inventory"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Admin Upload
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Student Pages
            </h2>
            <nav className="mt-3 grid gap-2">
              {studentLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 hover:bg-slate-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Admin Pages
            </h2>
            <nav className="mt-3 grid gap-2">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 hover:bg-slate-100"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </article>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            What This Solves
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Students know what is available before walking to The Hub.</li>
            <li>Staff can quickly update shelf inventory from photos.</li>
            <li>Checkout scanning helps keep stock counts accurate.</li>
            <li>Events and queue pages help with peak-hour planning.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
