
"use client";

import Link from "next/link";
import { useState } from "react";

const duplicateRecords = [
  {
    id: "DUP-001",
    invoice: "INV-1002",
    vendor: "Global Supplies",
    date: "30 October 2026",
    amount: 12500,
    matchedInvoice: "INV-1010",
    matchType: "Same invoice number",
    confidence: 100,
    status: "Confirmed",
  },
  {
    id: "DUP-002",
    invoice: "INV-1003",
    vendor: "ABC Technologies",
    date: "29 October 2026",
    amount: 45000,
    matchedInvoice: "INV-1001",
    matchType: "Same vendor and amount",
    confidence: 95,
    status: "Under Review",
  },
  {
    id: "DUP-003",
    invoice: "INV-1011",
    vendor: "Metro Solutions",
    date: "28 October 2026",
    amount: 28000,
    matchedInvoice: "INV-1004",
    matchType: "Similar invoice details",
    confidence: 88,
    status: "Under Review",
  },
  {
    id: "DUP-004",
    invoice: "INV-1015",
    vendor: "Digital World",
    date: "27 October 2026",
    amount: 67500,
    matchedInvoice: "INV-1005",
    matchType: "Same vendor and amount",
    confidence: 96,
    status: "Confirmed",
  },
];

export default function DuplicatesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredRecords = duplicateRecords.filter((record) => {
    const matchesSearch =
      record.invoice.toLowerCase().includes(search.toLowerCase()) ||
      record.vendor.toLowerCase().includes(search.toLowerCase()) ||
      record.matchedInvoice.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || record.status === filter;

    return matchesSearch && matchesFilter;
  });

  const confirmedCount = duplicateRecords.filter(
    (record) => record.status === "Confirmed"
  ).length;

  const reviewCount = duplicateRecords.filter(
    (record) => record.status === "Under Review"
  ).length;

  const totalAmount = duplicateRecords.reduce(
    (sum, record) => sum + record.amount,
    0
  );

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-slate-100 md:p-10">
      <div className="mx-auto max-w-7xl">

        <Link
          href="/"
          className="text-sm text-blue-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold">
            Duplicate Detection
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Identify and review potentially duplicated invoices.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            title="Total Flagged"
            value={duplicateRecords.length.toString()}
            color="text-blue-400"
          />

          <SummaryCard
            title="Confirmed Duplicates"
            value={confirmedCount.toString()}
            color="text-red-400"
          />

          <SummaryCard
            title="Under Review"
            value={reviewCount.toString()}
            color="text-yellow-400"
          />

          <SummaryCard
            title="Flagged Amount"
            value={"₹" + totalAmount.toLocaleString("en-IN")}
            color="text-purple-400"
          />

        </div>

        {/* Detection Information */}
        <section className="mb-8 rounded-xl border border-blue-900 bg-blue-950/20 p-5">
          <h2 className="font-semibold text-blue-400">
            Duplicate Detection Overview
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Invoices can be flagged based on matching invoice numbers,
            vendor information, invoice amounts and invoice details.
            Flagged records should be reviewed before payment approval.
          </p>
        </section>

        {/* Duplicate Records */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

            <h2 className="text-xl font-semibold">
              Flagged Invoices
            </h2>

            <div className="flex flex-wrap gap-3">

              <input
                type="text"
                placeholder="Search invoice or vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none focus:border-blue-500 sm:w-64"
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Under Review">Under Review</option>
              </select>

            </div>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-4 py-4">Invoice</th>
                  <th className="px-4 py-4">Vendor</th>
                  <th className="px-4 py-4">Matched Invoice</th>
                  <th className="px-4 py-4">Match Reason</th>
                  <th className="px-4 py-4">Confidence</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40"
                  >

                    <td className="px-4 py-5 font-semibold text-blue-400">
                      {record.invoice}
                    </td>

                    <td className="px-4 py-5">
                      {record.vendor}
                      <p className="mt-1 text-xs text-slate-500">
                        {record.date}
                      </p>
                    </td>

                    <td className="px-4 py-5 text-blue-400">
                      {record.matchedInvoice}
                    </td>

                    <td className="px-4 py-5 text-slate-300">
                      {record.matchType}
                    </td>

                    <td className="px-4 py-5">
                      <span className="font-semibold text-yellow-400">
                        {record.confidence}%
                      </span>
                    </td>

                    <td className="px-4 py-5 font-medium">
                      ₹{record.amount.toLocaleString("en-IN")}
                    </td>

                    <td className="px-4 py-5">
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                          record.status === "Confirmed"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>

                  </tr>
                ))}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      No duplicate records found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

          <p className="mt-5 text-sm text-slate-500">
            Showing {filteredRecords.length} of {duplicateRecords.length} flagged records
          </p>

        </section>

      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <h2 className={`mt-3 text-2xl font-bold ${color}`}>
        {value}
      </h2>
    </div>
  );
}
