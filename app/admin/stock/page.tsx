import Link from "next/link";

const stockFixes = [
  { item: "Frozen Mixed Fruit", before: 8, after: 6, reason: "Two bags damaged" },
  { item: "Canned Black Beans", before: 22, after: 24, reason: "Late donation intake" },
];

export default function AdminStockPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <main className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl md:p-8">
        <p className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
          Admin Inventory
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-4xl">
          Manual Stock Adjustments
        </h1>
        <p className="mt-3 text-sm text-slate-300 md:text-base">
          Use this page to correct item counts and categories if AI output needs edits.
        </p>

        <section className="mt-5 rounded-xl border border-white/10 bg-slate-950/45 p-4">
          <div className="overflow-auto rounded-lg border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-slate-800/70 text-slate-200">
                <tr>
                  <th className="px-3 py-2 font-semibold">Item</th>
                  <th className="px-3 py-2 font-semibold">Before</th>
                  <th className="px-3 py-2 font-semibold">After</th>
                  <th className="px-3 py-2 font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-900/60 text-slate-200">
                {stockFixes.map((fix) => (
                  <tr key={fix.item}>
                    <td className="px-3 py-2 text-slate-100">{fix.item}</td>
                    <td className="px-3 py-2">{fix.before}</td>
                    <td className="px-3 py-2 text-emerald-200">{fix.after}</td>
                    <td className="px-3 py-2">{fix.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <Link href="/admin" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-emerald-300/60">
            Admin Dashboard
          </Link>
          <Link href="/inventory" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-emerald-300/60">
            AI Inventory Upload
          </Link>
        </div>
      </main>
    </div>
  );
}
