
"use client";

import Link from "next/link";
import { useState } from "react";

const vendors = [
  {
    id: 1,
    name: "ABC Technologies",
    email: "contact@abctech.com",
    phone: "+91 9876543210",
    invoices: 12,
    amount: 245000,
    status: "Active",
  },
  {
    id: 2,
    name: "Global Supplies",
    email: "sales@globalsupplies.com",
    phone: "+91 9876543211",
    invoices: 8,
    amount: 125000,
    status: "Active",
  },
  {
    id: 3,
    name: "Metro Solutions",
    email: "info@metrosolutions.com",
    phone: "+91 9876543212",
    invoices: 5,
    amount: 98000,
    status: "Active",
  },
  {
    id: 4,
    name: "Digital World",
    email: "support@digitalworld.com",
    phone: "+91 9876543213",
    invoices: 10,
    amount: 325000,
    status: "Inactive",
  },
  {
    id: 5,
    name: "Smart Systems",
    email: "hello@smartsystems.com",
    phone: "+91 9876543214",
    invoices: 6,
    amount: 87000,
    status: "Active",
  },
];

export default function VendorsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(search.toLowerCase()) ||
      vendor.email.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || vendor.status === filter;

    return matchesSearch && matchesFilter;
  });

  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(
    (vendor) => vendor.status === "Active"
  ).length;

  const totalInvoices = vendors.reduce(
    (sum, vendor) => sum + vendor.invoices,
    0
  );

  const totalAmount = vendors.reduce(
    (sum, vendor) => sum + vendor.amount,
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
        <div className="mb-8 mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Vendor Management
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage vendor information and track invoice activity.
            </p>
          </div>

          <button
            onClick={() =>
              alert("Vendor creation will be connected to the backend.")
            }
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
          >
            + Add Vendor
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            title="Total Vendors"
            value={totalVendors.toString()}
            color="text-blue-400"
          />

          <SummaryCard
            title="Active Vendors"
            value={activeVendors.toString()}
            color="text-green-400"
          />

          <SummaryCard
            title="Total Invoices"
            value={totalInvoices.toString()}
            color="text-purple-400"
          />

          <SummaryCard
            title="Total Invoice Value"
            value={"₹" + totalAmount.toLocaleString("en-IN")}
            color="text-yellow-400"
          />

        </div>

        {/* Vendor Table */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

            <h2 className="text-xl font-semibold">
              All Vendors
            </h2>

            <div className="flex flex-wrap gap-3">

              <input
                type="text"
                placeholder="Search vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none focus:border-blue-500"
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none"
              >
                <option value="All">All Vendors</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

            </div>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-4 py-4">Vendor Name</th>
                  <th className="px-4 py-4">Contact</th>
                  <th className="px-4 py-4">Invoices</th>
                  <th className="px-4 py-4">Total Amount</th>
                  <th className="px-4 py-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40"
                  >

                    <td className="px-4 py-5">
                      <p className="font-semibold">
                        {vendor.name}
                      </p>
                    </td>

                    <td className="px-4 py-5">
                      <p>{vendor.email}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {vendor.phone}
                      </p>
                    </td>

                    <td className="px-4 py-5">
                      {vendor.invoices}
                    </td>

                    <td className="px-4 py-5 font-medium">
                      ₹{vendor.amount.toLocaleString("en-IN")}
                    </td>

                    <td className="px-4 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          vendor.status === "Active"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {vendor.status}
                      </span>
                    </td>

                  </tr>
                ))}

                {filteredVendors.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      No vendors found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

          <p className="mt-5 text-sm text-slate-500">
            Showing {filteredVendors.length} of {totalVendors} vendors
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
