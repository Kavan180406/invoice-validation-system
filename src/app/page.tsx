
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const invoices = [
  { id: "INV-1001", vendor: "ABC Technologies", date: "31 Oct 2026", amount: 45000, status: "Verified" },
  { id: "INV-1002", vendor: "Global Supplies", date: "30 Oct 2026", amount: 12500, status: "Duplicate" },
  { id: "INV-1003", vendor: "ABC Technologies", date: "29 Oct 2026", amount: 45000, status: "Duplicate" },
  { id: "INV-1004", vendor: "Metro Solutions", date: "28 Oct 2026", amount: 28000, status: "Pending" },
  { id: "INV-1005", vendor: "Digital World", date: "27 Oct 2026", amount: 67500, status: "Verified" },
  { id: "INV-1006", vendor: "Smart Systems", date: "26 Oct 2026", amount: 18000, status: "Pending" },
];

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.id.toLowerCase().includes(search.toLowerCase()) ||
        invoice.vendor.toLowerCase().includes(search.toLowerCase());

      const matchesFilter = filter === "All" || invoice.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  const formatAmount = (amount: number) =>
    "₹" + amount.toLocaleString("en-IN");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:flex">

      {/* Sidebar */}
      <aside className="w-full border-b border-slate-800 bg-slate-900 p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">

        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">
            Invoice<span className="text-blue-400">Guard</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Invoice Validation System
          </p>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Main Menu
        </p>

        <nav className="space-y-2">
          <a href="#dashboard" className="block rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white">
            ▦ Dashboard
          </a>

          <a href="#invoices" className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">
            ▤ Invoices
          </a>

          <a href="#duplicates" className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">
            ◈ Duplicate Detection
          </a>

          <a href="#vendors" className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">
            ♙ Vendors
          </a>

          <a href="#audit" className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800">
            ◷ Audit Logs
          </a>
        </nav>

        <div className="mt-10 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm font-semibold">InvoiceGuard</p>
          <p className="mt-1 text-xs text-slate-400">
            Protecting financial records through intelligent validation.
          </p>
        </div>

      </aside>

      {/* Main Content */}
      <main id="dashboard" className="min-w-0 flex-1 p-5 md:p-8">

        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">

          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-400">
              Monitor invoices and identify suspicious transactions.
            </p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2">
            <p className="text-sm font-semibold">Administrator</p>
            <p className="text-xs text-slate-400">Admin Account</p>
          </div>

        </header>

        {/* Statistics */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Invoices"
            value="1,248"
            subtitle="+12 this week"
            symbol="▤"
          />

          <StatCard
            title="Verified Invoices"
            value="1,102"
            subtitle="88.3% of invoices"
            symbol="✓"
          />

          <StatCard
            title="Duplicate Invoices"
            value="86"
            subtitle="Requires attention"
            symbol="◈"
          />

          <StatCard
            title="Pending Review"
            value="60"
            subtitle="Awaiting verification"
            symbol="◷"
          />

        </section>

        {/* Invoice Table */}
        <section
          id="invoices"
          className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-5"
        >

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

            <div>
              <h3 className="text-lg font-semibold">Recent Invoices</h3>
              <p className="text-sm text-slate-400">
                Review and monitor submitted invoices.
              </p>
            </div>

            {/* Navigate to Add Invoice Page */}
            <Link
              href="/invoices/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
            >
              + Add Invoice
            </Link>

          </div>

          {/* Search and Filter */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">

            <input
              type="text"
              placeholder="Search invoice ID or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none focus:border-blue-500"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none"
            >
              <option>All</option>
              <option>Verified</option>
              <option>Duplicate</option>
              <option>Pending</option>
            </select>

          </div>

          {/* Invoice Table */}
          <div className="overflow-x-auto">

            <table className="w-full min-w-[650px] text-left text-sm">

              <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-4">Invoice ID</th>
                  <th className="px-3 py-4">Vendor</th>
                  <th className="px-3 py-4">Date</th>
                  <th className="px-3 py-4">Amount</th>
                  <th className="px-3 py-4">Status</th>
                </tr>
              </thead>

              <tbody>

                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-slate-800 hover:bg-slate-800/50"
                  >
                    <td className="px-3 py-4 font-medium text-blue-400">
                      {invoice.id}
                    </td>

                    <td className="px-3 py-4">
                      {invoice.vendor}
                    </td>

                    <td className="px-3 py-4 text-slate-400">
                      {invoice.date}
                    </td>

                    <td className="px-3 py-4">
                      {formatAmount(invoice.amount)}
                    </td>

                    <td className="px-3 py-4">
                      <StatusBadge status={invoice.status} />
                    </td>
                  </tr>
                ))}

                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No invoices found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

          <p className="mt-4 text-xs text-slate-500">
            Showing {filteredInvoices.length} of {invoices.length} sample invoices
          </p>

        </section>

        {/* Duplicate Alerts */}
        <section
          id="duplicates"
          className="rounded-xl border border-slate-800 bg-slate-900 p-5"
        >

          <div className="mb-4">
            <h3 className="text-lg font-semibold">
              Duplicate Detection Alerts
            </h3>

            <p className="text-sm text-slate-400">
              Potentially suspicious invoice records.
            </p>
          </div>

          <div className="space-y-3">

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-900/50 bg-red-950/20 p-4">

              <div>
                <p className="text-sm font-semibold">
                  INV-1002 and INV-1003
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Same vendor and matching amount
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-red-400">98% Match</p>
                <p className="text-xs text-slate-500">High similarity</p>
              </div>

            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-4">

              <div>
                <p className="text-sm font-semibold">INV-1004</p>

                <p className="mt-1 text-xs text-slate-400">
                  Invoice requires manual validation
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-yellow-400">Review</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>

            </div>

          </div>

        </section>

        <footer className="mt-8 text-center text-xs text-slate-500">
          InvoiceGuard © 2026 | Invoice Validation & Duplicate Detection System
        </footer>

      </main>

    </div>
  );
}

// Statistics Card Component
function StatCard({
  title,
  value,
  subtitle,
  symbol,
}: {
  title: string;
  value: string;
  subtitle: string;
  symbol: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <span className="text-xl text-blue-400">{symbol}</span>
      </div>

      <h3 className="text-3xl font-bold">{value}</h3>

      <p className="mt-2 text-xs text-slate-500">
        {subtitle}
      </p>

    </div>
  );
}

// Invoice Status Component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Verified: "bg-green-500/10 text-green-400",
    Duplicate: "bg-red-500/10 text-red-400",
    Pending: "bg-yellow-500/10 text-yellow-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status] || "bg-slate-700 text-slate-300"}`}
    >
      {status}
    </span>
  );
}
