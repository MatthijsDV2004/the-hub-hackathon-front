import Link from "next/link";

const adminCards = [
  {
    title: "AI Inventory Upload",
    detail: "Upload shelf photos and parse brand/name/count with Gemini.",
    href: "/inventory",
  },
  {
    title: "Manual Stock Edit",
    detail: "Correct quantities and categories when needed.",
    href: "/admin/stock",
  },
  {
    title: "Hours Management",
    detail: "Update open hours and location details for students.",
    href: "/admin/hours",
  },
  {
    title: "Event Management",
    detail: "Create events and configure queue windows.",
    href: "/admin/events",
  },
  {
    title: "Checkout Scanner",
    detail: "Take table photos and decrement shelf inventory.",
    href: "/checkout",
  },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <main className="mx-auto w-full max-w-5xl space-y-5 rounded-3xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl md:p-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex rounded-full border border-violet-300/40 bg-violet-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-100">
              Admin
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-4xl">
              Hub Operations Dashboard
            </h1>
          </div>
          <Link href="/" className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:border-violet-300/60">
            Back Home
          </Link>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {adminCards.map((card) => (
            <Link key={card.href} href={card.href} className="rounded-xl border border-white/10 bg-slate-950/45 p-4 transition hover:border-violet-300/50">
              <h2 className="text-base font-semibold text-white">{card.title}</h2>
              <p className="mt-1 text-sm text-slate-300">{card.detail}</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
