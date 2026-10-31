
"use client";

import Link from "next/link";
import { useState } from "react";

const auditLogs = [
  {
    id: 1,
    user: "Administrator",
    action: "Invoice Created",
    invoice: "INV-1001",
    description: "New invoice added to the system",
    date: "31 October 2026",
    time: "09:15 AM",
    type: "Create",
  },
  {
    id: 2,
    user: "Finance Staff",
    action: "Invoice Updated",
    invoice: "INV-1002",
    description: "Invoice details and amount updated",
    date: "31 October 2026",
    time: "09:22 AM",
    type: "Update",
  },
  {
    id: 3,
    user: "Administrator",
    action: "Duplicate Detected",
    invoice: "INV-1003",
    description: "Potential duplicate invoice identified",
    date: "31 October 2026",
    time: "09:30 AM",
    type: "Alert",
  },
  {
    id: 4,
    user: "Finance Staff",
    action: "Invoice Verified",
    invoice: "INV-1004",
    description: "Invoice successfully verified",
    date: "30 October 2026",
    time: "04:15 PM",
    type: "Verify",
  },
  {
    id: 5,
    user: "Administrator",
    action: "Invoice Deleted",
    invoice: "INV-1005",
    description: "Invoice deletion requested",
    date: "30 October 2026",
    time: "03:45 PM",
    type: "Delete",
  },
  {
    id: 6,
    user: "Finance Staff",
    action: "Vendor Added",
    invoice: "N/A",
    description: "New vendor registered in the system",
    date: "29 October 2026",
    time: "11:20 AM",
    type: "Create",
  },
  {
    id: 7,
    user: "Administrator",
    action: "Invoice Updated",
    invoice: "INV-1006",
    description: "Invoice status changed to Pending",
    date: "29 October 2026",
    time: "10:05 AM",
    type: "Update",
  },
];

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.invoice.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || log.type === filter;

    return matchesSearch && matchesFilter;
  });

  const createCount = auditLogs.filter(
    (log) => log.type === "Create"
  ).length;

  const updateCount = auditLogs.filter(
    (log) => log.type === "Update"
  ).length;

  const alertCount = auditLogs.filter(
    (log) => log.type === "Alert"
  ).length;

  const deleteCount = auditLogs.filter(
    (log) => log.type === "Delete"
  ).length;

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
            Audit Logs
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor system activities and maintain a record of important actions.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            title="Total Activities"
            value={auditLogs.length.toString()}
            color="text-blue-400"
          />

          <SummaryCard
            title="Created Records"
            value={createCount.toString()}
            color="text-green-400"
          />

          <SummaryCard
            title="Updated Records"
            value={updateCount.toString()}
            color="text-yellow-400"
          />

          <SummaryCard
            title="Alerts and Deletions"
            value={(alertCount + deleteCount).toString()}
            color="text-red-400"
          />

        </div>

        {/* Audit Information */}
        <section className="mb-8 rounded-xl border border-blue-900 bg-blue-950/20 p-5">
          <h2 className="font-semibold text-blue-400">
            Audit Trail Information
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Audit logs maintain a history of important system activities,
            including invoice creation, updates, deletion requests,
            verification and duplicate alerts. These records help
            administrators monitor activity and maintain accountability.
          </p>
        </section>

        {/* Activity Table */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

            <h2 className="text-xl font-semibold">
              Activity History
            </h2>

            <div className="flex flex-wrap gap-3">

              <input
                type="text"
                placeholder="Search activities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none focus:border-blue-500 sm:w-64"
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none"
              >
                <option value="All">All Activities</option>
                <option value="Create">Create</option>
                <option value="Update">Update</option>
                <option value="Delete">Delete</option>
                <option value="Alert">Alert</option>
                <option value="Verify">Verify</option>
              </select>

            </div>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-4 py-4">User</th>
                  <th className="px-4 py-4">Activity</th>
                  <th className="px-4 py-4">Invoice ID</th>
                  <th className="px-4 py-4">Description</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Time</th>
                  <th className="px-4 py-4">Type</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40"
                  >

                    <td className="whitespace-nowrap px-4 py-5 font-medium">
                      {log.user}
                    </td>

                    <td className="whitespace-nowrap px-4 py-5 font-semibold">
                      {log.action}
                    </td>

                    <td className="whitespace-nowrap px-4 py-5 text-blue-400">
                      {log.invoice}
                    </td>

                    <td className="min-w-64 px-4 py-5 text-slate-400">
                      {log.description}
                    </td>

                    <td className="whitespace-nowrap px-4 py-5">
                      {log.date}
                    </td>

                    <td className="whitespace-nowrap px-4 py-5 text-slate-400">
                      {log.time}
                    </td>

                    <td className="whitespace-nowrap px-4 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          log.type === "Create"
                            ? "bg-green-500/10 text-green-400"
                            : log.type === "Update"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : log.type === "Delete"
                            ? "bg-red-500/10 text-red-400"
                            : log.type === "Alert"
                            ? "bg-orange-500/10 text-orange-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>

                  </tr>
                ))}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      No activity records found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

          <p className="mt-5 text-sm text-slate-500">
            Showing {filteredLogs.length} of {auditLogs.length} activities
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
