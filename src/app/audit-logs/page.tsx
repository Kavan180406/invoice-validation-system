
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import API_BASE_URL from "@/lib/api";
import { apiFetch } from "@/lib/api";

type AuditLog = {
  _id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  timestamp: string;
  user_name?: string | null;
  user_email?: string | null;
  user_role?: string | null;
  user_id?: number | null;
};

type ActivityType =
  | "Create"
  | "Update"
  | "Delete"
  | "Alert"
  | "Verify"
  | "Other";

function getActivityType(action: string): ActivityType {
  const normalized = action.toUpperCase();

  if (normalized.includes("CREATED")) return "Create";
  if (normalized.includes("UPDATED")) return "Update";
  if (normalized.includes("DELETED")) return "Delete";
  if (normalized.includes("DUPLICATE")) return "Alert";
  if (normalized.includes("VALIDATED")) return "Verify";

  return "Other";
}

function getActionLabel(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getDescription(log: AuditLog) {
  const details = log.details || {};

  if (log.action === "INVOICE_CREATED") {
    return `New invoice ${details.invoice_number || log.entity_id} added to the system`;
  }

  if (log.action === "INVOICE_UPDATED") {
    return `Invoice ${details.invoice_number || log.entity_id} details updated`;
  }

  if (log.action === "INVOICE_DELETED") {
    return `Invoice ${details.invoice_number || log.entity_id} deleted`;
  }

  if (log.action === "INVOICE_VALIDATED") {
    return `Invoice ${details.invoice_number || log.entity_id} validation performed`;
  }

  if (log.action === "DUPLICATE_CHECKED") {
    return `Duplicate detection performed for invoice ${details.invoice_number || log.entity_id}`;
  }

  return `${log.entity_type} record ${log.entity_id}: ${JSON.stringify(details)}`;
}

function formatDate(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(`${API_BASE_URL}/audit-logs/`);

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs from the server.");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected audit logs response format.");
      }

      setAuditLogs(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading audit logs."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const action = getActionLabel(log.action);

      const invoice = String(
        log.details?.invoice_number || log.entity_id || "N/A"
      );

      const description = getDescription(log);
      const type = getActivityType(log.action);
      const userName = log.user_name || "Not recorded";

      const matchesSearch =
        action.toLowerCase().includes(search.toLowerCase()) ||
        invoice.toLowerCase().includes(search.toLowerCase()) ||
        description.toLowerCase().includes(search.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
        userName.toLowerCase().includes(search.toLowerCase());

      const matchesFilter = filter === "All" || type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [auditLogs, search, filter]);

  const createCount = auditLogs.filter(
    (log) => getActivityType(log.action) === "Create"
  ).length;

  const updateCount = auditLogs.filter(
    (log) => getActivityType(log.action) === "Update"
  ).length;

  const alertDeleteCount = auditLogs.filter((log) => {
    const type = getActivityType(log.action);
    return type === "Alert" || type === "Delete";
  }).length;

  const getTypeStyle = (type: ActivityType) => {
    switch (type) {
      case "Create":
        return "bg-green-500/10 text-green-400";
      case "Update":
        return "bg-yellow-500/10 text-yellow-400";
      case "Delete":
        return "bg-red-500/10 text-red-400";
      case "Alert":
        return "bg-orange-500/10 text-orange-400";
      case "Verify":
        return "bg-blue-500/10 text-blue-400";
      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-slate-100 md:p-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-blue-400 hover:underline"
        >
          <span aria-hidden="true">←</span>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8 mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>

            <p className="mt-2 text-sm text-slate-400">
              Monitor system activities and maintain a record of important actions.
            </p>
          </div>

          <button
            onClick={fetchAuditLogs}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Logs"}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Activities"
            value={loading ? "..." : auditLogs.length.toString()}
            color="text-blue-400"
          />

          <SummaryCard
            title="Created Records"
            value={loading ? "..." : createCount.toString()}
            color="text-green-400"
          />

          <SummaryCard
            title="Updated Records"
            value={loading ? "..." : updateCount.toString()}
            color="text-yellow-400"
          />

          <SummaryCard
            title="Alerts and Deletions"
            value={loading ? "..." : alertDeleteCount.toString()}
            color="text-red-400"
          />
        </div>

        {/* Audit Information */}
        <section className="mb-8 rounded-xl border border-blue-900 bg-blue-950/20 p-5">
          <h2 className="font-semibold text-blue-400">
            Audit Trail Information
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Audit logs are retrieved from MongoDB and maintain a history
            of important system activities, including invoice creation,
            updates, deletion, validation and duplicate detection.
            These records help administrators monitor activity and
            maintain accountability.
          </p>
        </section>

        {/* Activity Table */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Activity History</h2>

              <p className="mt-1 text-sm text-slate-400">
                Live audit records retrieved from MongoDB.
              </p>
            </div>

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
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {loading && (
            <p className="py-10 text-center text-blue-400">
              Loading audit records from MongoDB...
            </p>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-5 text-center">
              <p className="text-sm text-red-400">{error}</p>

              <p className="mt-2 text-xs text-slate-400">
                Confirm that the backend GET /audit-logs/ endpoint is implemented and running.
              </p>

              <button
                onClick={fetchAuditLogs}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
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
                    {filteredLogs.map((log, index) => {
                      const type = getActivityType(log.action);

                      return (
                        <tr
                          key={
                            log._id ||
                            `${log.entity_id}-${log.timestamp}-${index}`
                          }
                          className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40"
                        >
                          <td className="whitespace-nowrap px-4 py-5 font-medium">
                            <div>{log.user_name || "Not recorded"}</div>

                            {log.user_role && (
                              <div className="mt-1 text-xs text-slate-500">
                                {log.user_role}
                              </div>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-5 font-semibold">
                            {getActionLabel(log.action)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-5 text-blue-400">
                            {String(
                              log.details?.invoice_number ||
                              log.entity_id ||
                              "N/A"
                            )}
                          </td>

                          <td className="min-w-64 px-4 py-5 text-slate-400">
                            {getDescription(log)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-5">
                            {formatDate(log.timestamp)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-5 text-slate-400">
                            {formatTime(log.timestamp)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-5">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeStyle(type)}`}
                            >
                              {type}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

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
            </>
          )}
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
      <p className="text-sm text-slate-400">{title}</p>

      <h2 className={`mt-3 text-2xl font-bold ${color}`}>
        {value}
      </h2>
    </div>
  );
}
