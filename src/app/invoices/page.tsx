
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const invoiceData = [
  {
    id: "INV-1001",
    vendor: "ABC Technologies",
    date: "2026-10-31",
    amount: 45000,
    status: "Verified",
  },
  {
    id: "INV-1002",
    vendor: "Global Supplies",
    date: "2026-10-30",
    amount: 12500,
    status: "Duplicate",
  },
  {
    id: "INV-1003",
    vendor: "ABC Technologies",
    date: "2026-10-29",
    amount: 45000,
    status: "Duplicate",
  },
  {
    id: "INV-1004",
    vendor: "Metro Solutions",
    date: "2026-10-28",
    amount: 28000,
    status: "Pending",
  },
  {
    id: "INV-1005",
    vendor: "Digital World",
    date: "2026-10-27",
    amount: 67500,
    status: "Verified",
  },
  {
    id: "INV-1006",
    vendor: "Smart Systems",
    date: "2026-10-26",
    amount: 18000,
    status: "Pending",
  },
];

export default function InvoiceManagement() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredInvoices = useMemo(() => {
    return invoiceData.filter((invoice) => {
      const matchesSearch =
        invoice.id.toLowerCase().includes(search.toLowerCase()) ||
        invoice.vendor.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filter === "All" || invoice.status === filter;

      return matchesSearch && matchesStatus;
    });
  }, [search, filter]);

  const totalAmount = filteredInvoices.reduce(
    (sum, invoice) => sum + invoice.amount,
    0
  );

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-slate-100 md:p-8">

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

        <div>
          <Link
            href="/"
            className="mb-4 inline-block text-sm text-blue-400 hover:underline"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold">
            Invoice Management
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Manage, search and review all submitted invoices.
          </p>
        </div>

        <Link
          href="/invoices/new"
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
        >
          + Add Invoice
        </Link>

      </div>

      {/* Summary Cards */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <SummaryCard
          title="Total Invoices"
          value={filteredInvoices.length.toString()}
        />

        <SummaryCard
          title="Verified Invoices"
          value={filteredInvoices.filter(
            (invoice) => invoice.status === "Verified"
          ).length.toString()}
        />

        <SummaryCard
          title="Total Invoice Amount"
          value={"₹" + totalAmount.toLocaleString("en-IN")}
        />

      </section>

      {/* Invoice Table */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            All Invoices
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Search and filter invoice records.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row">

          <input
            type="text"
            placeholder="Search by invoice ID or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none"
          >
            <option value="All">All Status</option>
            <option value="Verified">Verified</option>
            <option value="Duplicate">Duplicate</option>
            <option value="Pending">Pending</option>
          </select>

        </div>

        {/* Invoice Table */}
        <div className="overflow-x-auto">

          <table className="w-full min-w-[750px] text-left text-sm">

            <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-4">Invoice ID</th>
                <th className="px-4 py-4">Vendor</th>
                <th className="px-4 py-4">Invoice Date</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Action</th>
              </tr>
            </thead>

            <tbody>

              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-slate-800 hover:bg-slate-800/50"
                >

                  <td className="px-4 py-5 font-medium text-blue-400">
                    {invoice.id}
                  </td>

                  <td className="px-4 py-5">
                    {invoice.vendor}
                  </td>

                  <td className="px-4 py-5 text-slate-400">
                    {invoice.date}
                  </td>

                  <td className="px-4 py-5 font-medium">
                    ₹{invoice.amount.toLocaleString("en-IN")}
                  </td>

                  <td className="px-4 py-5">
                    <StatusBadge status={invoice.status} />
                  </td>

                  <td className="px-4 py-5">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-blue-400 hover:underline"
                    >
                      View
                    </Link>
                  </td>

                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-slate-400"
                  >
                    No invoices found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

        <p className="mt-5 text-xs text-slate-500">
          Showing {filteredInvoices.length} invoices
        </p>

      </section>

    </main>
  );
}

// Summary Card
function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <h2 className="mt-3 text-2xl font-bold">{value}</h2>
    </div>
  );
}

// Invoice Status Badge
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Verified: "bg-green-500/10 text-green-400",
    Duplicate: "bg-red-500/10 text-red-400",
    Pending: "bg-yellow-500/10 text-yellow-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
