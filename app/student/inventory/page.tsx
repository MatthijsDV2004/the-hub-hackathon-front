import Link from "next/link";

const sampleInventory = [
  {
    brand: "Trader Joe's",
    name: "Sparkling Water",
    category: "beverage",
    quantity: 12,
    size: "12 oz cans",
    updatedAt: "10:18 AM",
  },
  {
    brand: "Target Good & Gather",
    name: "Black Beans",
    category: "dry",
    quantity: 22,
    size: "15 oz cans",
    updatedAt: "10:18 AM",
  },
  {
    brand: "Dole",
    name: "Frozen Mixed Fruit",
    category: "frozen",
    quantity: 6,
    size: "16 oz bag",
    updatedAt: "10:18 AM",
  },
  {
    brand: "Chobani",
    name: "Greek Yogurt",
    category: "refrigerated",
    quantity: 9,
    size: "5.3 oz cup",
    updatedAt: "10:18 AM",
  },
];

export default function StudentInventoryPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <main className="mx-auto w-full max-w-5xl space-y-5 rounded-3xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl md:p-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
              Student View
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-4xl">
              Current Hub Inventory
            </h1>
            <p className="mt-2 text-sm text-slate-300 md:text-base">
              Updated from staff shelf photos so you can check stock before you visit The Hub.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-xs">
            <Link href="/" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-cyan-300/60">
              Home
            </Link>
            <Link href="/hours" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-cyan-300/60">
              Hours
            </Link>
            <Link href="/events" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-cyan-300/60">
              Events
            </Link>
          </nav>
        </header>

        <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="overflow-auto rounded-xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-slate-800/70 text-slate-200">
                <tr>
                  <th className="px-3 py-2 font-semibold">Brand</th>
                  <th className="px-3 py-2 font-semibold">Item</th>
                  <th className="px-3 py-2 font-semibold">Category</th>
                  <th className="px-3 py-2 font-semibold">Qty</th>
                  <th className="px-3 py-2 font-semibold">Size</th>
                  <th className="px-3 py-2 font-semibold">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-900/60 text-slate-200">
                {sampleInventory.map((item) => (
                  <tr key={`${item.brand}-${item.name}`}>
                    <td className="px-3 py-2">{item.brand}</td>
                    <td className="px-3 py-2 text-slate-100">{item.name}</td>
                    <td className="px-3 py-2">{item.category}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">{item.size}</td>
                    <td className="px-3 py-2 text-emerald-200">{item.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-sm text-slate-400">
          This is the student-facing board route. Connect this page to live query results when your
          read API is ready.
        </p>
      </main>
    </div>
  );
}
