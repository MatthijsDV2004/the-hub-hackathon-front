import Link from "next/link";

const topNav = [
  { href: "/student/inventory", label: "Student Inventory" },
  { href: "/hours", label: "Hours" },
  { href: "/events", label: "Events + Queue" },
  { href: "/inventory", label: "AI Inventory Parser" },
  { href: "/admin", label: "Admin Dashboard" },
];

const workflowSteps = [
  {
    title: "1. Staff capture shelf photos",
    detail:
      "Admins snap photos of pantry, refrigerated, and frozen sections throughout the week.",
  },
  {
    title: "2. AI extracts brand + count",
    detail:
      "Gemini parses item name, brand, package size, and estimated quantity from each photo.",
  },
  {
    title: "3. Inventory board updates",
    detail:
      "Students can view what is in stock before they walk to The Hub.",
  },
  {
    title: "4. Checkout photos decrement stock",
    detail:
      "At checkout, admins can re-scan student selections to keep counts accurate in real time.",
  },
];

const routeCards = [
  {
    audience: "Student",
    title: "Live Inventory Board",
    href: "/student/inventory",
    detail: "Browse current products, brand names, and estimated counts by category.",
  },
  {
    audience: "Student",
    title: "Hours + Location",
    href: "/hours",
    detail: "See when The Hub is open so students can plan around classes.",
  },
  {
    audience: "Student",
    title: "Events + Queue",
    href: "/events",
    detail: "Subscribe to events and join check-in queues during peak hours.",
  },
  {
    audience: "Admin",
    title: "AI Inventory Parser",
    href: "/inventory",
    detail: "Upload shelf photos and generate a structured inventory snapshot.",
  },
  {
    audience: "Admin",
    title: "Admin Dashboard",
    href: "/admin",
    detail: "Manage stock, hours, events, and checkout operations from one place.",
  },
  {
    audience: "Admin",
    title: "Checkout Scanner",
    href: "/checkout",
    detail: "Capture table photos during checkout to decrement inventory counts.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04131a] px-4 py-6 text-slate-100 md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_5%_8%,rgba(14,165,233,0.22),transparent_26%),radial-gradient(circle_at_95%_18%,rgba(251,146,60,0.24),transparent_35%),radial-gradient(circle_at_28%_88%,rgba(34,197,94,0.16),transparent_28%),linear-gradient(145deg,#04131a,#071d26_42%,#102533)]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/2 h-72 w-72 rounded-full bg-orange-300/20 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <header className="rounded-2xl border border-white/15 bg-slate-950/45 p-4 backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-cyan-300 to-emerald-300 px-2 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-950">
                HubOS
              </div>
              <p className="text-sm text-slate-200">
                Basic Needs Hub Inventory Platform
              </p>
            </div>
            <nav className="flex flex-wrap gap-2">
              {topNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-cyan-300/60 hover:bg-cyan-300/10"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="mt-5 space-y-5">
          <section className="rounded-3xl border border-white/15 bg-slate-950/50 p-6 shadow-[0_25px_65px_rgba(2,6,23,0.6)] backdrop-blur-xl md:p-8">
            <p className="inline-flex rounded-full border border-cyan-300/50 bg-cyan-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">
              Hackathon MVP
            </p>
            <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
              Let students see what is in stock before they walk to The Hub.
            </h1>
            <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-200 md:text-lg">
              Your team is solving a real campus problem: donated groceries arrive a few times a week,
              inventory changes fast, and students should know what is available before they come in.
              This platform combines photo uploads, AI parsing, and admin workflows so staff can keep
              inventory accurate and students can plan their visit.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/student/inventory"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-300 via-emerald-300 to-lime-200 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                View Student Inventory
              </Link>
              <Link
                href="/inventory"
                className="inline-flex items-center justify-center rounded-xl border border-orange-300/50 bg-orange-300/15 px-4 py-2.5 text-sm font-semibold text-orange-100 transition hover:bg-orange-300/25"
              >
                Upload Shelf Photo (Admin)
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-slate-900/55 p-4">
                <p className="text-2xl font-semibold text-cyan-200">2x / week</p>
                <p className="mt-1 text-sm text-slate-300">Donation drops from local partners</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-slate-900/55 p-4">
                <p className="text-2xl font-semibold text-emerald-200">Brand + name + count</p>
                <p className="mt-1 text-sm text-slate-300">AI extracts the fields students care about</p>
              </article>
              <article className="rounded-2xl border border-white/10 bg-slate-900/55 p-4">
                <p className="text-2xl font-semibold text-orange-200">Queue aware</p>
                <p className="mt-1 text-sm text-slate-300">Events + check-in for peak-hour traffic</p>
              </article>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-2xl border border-white/15 bg-slate-950/45 p-5 backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white">Workflow</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {workflowSteps.map((step) => (
                  <div key={step.title} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                    <h3 className="text-sm font-semibold text-cyan-100">{step.title}</h3>
                    <p className="mt-1 text-sm text-slate-300">{step.detail}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-white/15 bg-slate-950/45 p-5 backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white">Problems Solved</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  Students know if key items are available before they arrive.
                </li>
                <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  Admins can enforce limits on frozen/refrigerated categories with better data.
                </li>
                <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  Checkout photos help reduce stock drift without manual recounts.
                </li>
                <li className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  Event queue tracking helps students plan for high-traffic time windows.
                </li>
              </ul>
            </article>
          </section>

          <section className="rounded-2xl border border-white/15 bg-slate-950/45 p-5 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white">Product Pages</h2>
            <p className="mt-1 text-sm text-slate-300">
              Every route below is wired in this app so your demo has clear student and admin flows.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {routeCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group rounded-xl border border-white/15 bg-slate-900/60 p-4 transition hover:-translate-y-0.5 hover:border-emerald-300/55 hover:bg-slate-900"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">
                    {card.audience}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-white group-hover:text-emerald-100">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">{card.detail}</p>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
