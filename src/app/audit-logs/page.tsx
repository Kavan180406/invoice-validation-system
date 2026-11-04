
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
  const invoice = String(details.invoice_number || log.entity_id || "N/A");
  const duplicateCheckId = details.duplicate_check_id;
  const matchedInvoiceId = details.matched_invoice_id;
  const reviewStatus = String(details.review_status || "").toUpperCase();
  const invoiceStatus = String(details.invoice_status || "").toUpperCase();

  switch (log.action) {
    case "INVOICE_CREATED":
      return `Invoice ${invoice} was created and added to InvoiceGuard.`;

    case "INVOICE_UPDATED":
      return `Details for invoice ${invoice} were updated.`;

    case "INVOICE_DELETED":
      return `Invoice ${invoice} was deleted from the system.`;

    case "INVOICE_VALIDATED":
      return `Validation was performed for invoice ${invoice}.`;

    case "DUPLICATE_CHECKED":
      return `Duplicate detection was performed for invoice ${invoice}. Potential matches were recorded for review.`;

    case "DUPLICATE_CONFIRMED":
      return `Duplicate check #${duplicateCheckId ?? "N/A"} was confirmed. The invoice was marked as ${invoiceStatus || "DUPLICATE"}${matchedInvoiceId != null ? ` because it matched invoice #${matchedInvoiceId}` : ""}.`;

    case "DUPLICATE_DISMISSED":
      return `Duplicate check #${duplicateCheckId ?? "N/A"} was dismissed${matchedInvoiceId != null ? ` after reviewing matched invoice #${matchedInvoiceId}` : ""}. The invoice remains ${invoiceStatus || "unchanged"}.`;

    default:
      if (log.action.toUpperCase().includes("DUPLICATE")) {
        return `A duplicate-related action was recorded for invoice ${invoice}. Review status: ${reviewStatus || "not specified"}.`;
      }

      return `${getActionLabel(log.action)} recorded for ${log.entity_type || "record"} ${log.entity_id || "N/A"}.`;
  }
}

// Display audit timestamps consistently in India Standard Time.
const AUDIT_TIME_ZONE = "Asia/Kolkata";

function formatDate(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-IN", {
    timeZone: AUDIT_TIME_ZONE,
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleTimeString("en-IN", {
    timeZone: AUDIT_TIME_ZONE,
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
        return "bg-green-50 text-green-700";
      case "Update":
        return "bg-amber-50 text-amber-700";
      case "Delete":
        return "bg-red-50 text-red-700";
      case "Alert":
        return "bg-orange-50 text-orange-700";
      case "Verify":
        return "bg-blue-50 text-blue-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <main className="min-h-screen bg-[#eaf0f8] px-4 py-7 text-[#14243b] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#315b8a] transition hover:text-blue-700"
        >
          <span aria-hidden="true" className="text-lg">←</span>
          Back to Dashboard
        </Link>

        {/* Page Header */}
        <div className="mb-7 mt-6 overflow-hidden rounded-2xl bg-[#14243b] p-6 text-white shadow-md sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                SYSTEM MONITORING
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Audit Logs
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/75">
                Monitor system activities and maintain a record of important
                actions performed across InvoiceGuard.
              </p>
            </div>

            <button
              onClick={fetchAuditLogs}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>↻</span>
              {loading ? "Refreshing..." : "Refresh Logs"}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Activities"
            value={loading ? "..." : auditLogs.length.toString()}
            subtitle="All recorded events"
            icon="◈"
            color="blue"
          />

          <SummaryCard
            title="Created Records"
            value={loading ? "..." : createCount.toString()}
            subtitle="Creation activities"
            icon="+"
            color="green"
          />

          <SummaryCard
            title="Updated Records"
            value={loading ? "..." : updateCount.toString()}
            subtitle="Modification activities"
            icon="✎"
            color="amber"
          />

          <SummaryCard
            title="Alerts and Deletions"
            value={loading ? "..." : alertDeleteCount.toString()}
            subtitle="Alerts and deletion events"
            icon="!"
            color="red"
          />
        </div>

        {/* Audit Information */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-[#dce5f1] bg-white shadow-sm">
          <div className="flex items-start gap-4 p-5 sm:p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-700">
              i
            </div>

            <div>
              <h2 className="font-bold text-[#14243b]">
                Audit Trail Information
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Audit logs are retrieved from MongoDB and maintain a history
                of important system activities, including invoice creation,
                updates, deletion, validation and duplicate detection.
                These records help administrators monitor activity and
                maintain accountability.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  Activity tracking
                </span>
                <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  User accountability
                </span>
                <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  Event history
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Activity History */}
        <section className="overflow-hidden rounded-2xl border border-[#dce5f1] bg-white shadow-sm">

          {/* Table Heading */}
          <div className="border-b border-[#e7edf5] bg-[#f2f6fc] px-5 py-5 sm:px-7">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold text-[#14243b]">
                  Activity History
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Audit records retrieved from MongoDB.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    ⌕
                  </span>

                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-[#d7e1ee] bg-white py-2.5 pl-9 pr-4 text-sm text-[#14243b] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-64"
                  />
                </div>

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="rounded-xl border border-[#d7e1ee] bg-white px-4 py-2.5 text-sm text-[#14243b] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
          </div>

          <div className="p-5 sm:p-7">

            {/* Loading State */}
            {loading && (
              <div className="py-14 text-center">
                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                <p className="font-semibold text-[#31506f]">
                  Loading audit records...
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Retrieving activity history from MongoDB.
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-xl font-bold text-red-600">
                  !
                </div>

                <p className="text-sm font-semibold text-red-700">
                  {error}
                </p>

                <p className="mt-2 text-xs text-red-600/80">
                  Confirm that the backend GET /audit-logs/ endpoint is
                  implemented and running.
                </p>

                <button
                  onClick={fetchAuditLogs}
                  className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Activity Table */}
            {!loading && !error && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px] table-fixed text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#e7edf5] text-xs uppercase tracking-wide text-slate-500">
                        <th className="w-[12%] px-4 py-4 font-semibold">User</th>
                        <th className="w-[14%] px-4 py-4 font-semibold">Activity</th>
                        <th className="w-[12%] px-4 py-4 font-semibold">Invoice ID</th>
                        <th className="w-[32%] px-4 py-4 font-semibold">Description</th>
                        <th className="w-[14%] px-4 py-4 font-semibold">Date</th>
                        <th className="w-[9%] px-4 py-4 font-semibold">Time (IST)</th>
                        <th className="w-[7%] px-4 py-4 font-semibold">Type</th>
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
                            className="border-b border-[#edf1f7] transition last:border-0 hover:bg-[#f8faff]"
                          >
                            <td className="whitespace-nowrap px-4 py-5">
                              <div className="font-semibold text-[#14243b]">
                                {log.user_name || "Not recorded"}
                              </div>

                              {log.user_role && (
                                <div className="mt-1 text-xs text-slate-500">
                                  {log.user_role}
                                </div>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-5 font-semibold text-[#31506f]">
                              {getActionLabel(log.action)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-5 font-semibold text-blue-700">
                              {String(
                                log.details?.invoice_number ||
                                log.entity_id ||
                                "N/A"
                              )}
                            </td>

                            <td className="whitespace-normal break-words px-4 py-5 leading-6 text-slate-600">
                              {getDescription(log)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-5 text-[#31506f]">
                              {formatDate(log.timestamp)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-5 text-slate-500">
                              {formatTime(log.timestamp)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-5">
                              <span
                                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getTypeStyle(type)}`}
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
                            className="px-4 py-14 text-center"
                          >
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf3fb] text-xl text-[#315b8a]">
                              ◈
                            </div>

                            <p className="font-semibold text-[#31506f]">
                              No activity records found.
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Try changing your search or activity filter.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf1f7] pt-4">
                  <p className="text-xs text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-[#31506f]">
                      {filteredLogs.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-[#31506f]">
                      {auditLogs.length}
                    </span>{" "}
                    activities
                  </p>

                  <p className="text-xs text-slate-400">
                    InvoiceGuard Audit Trail
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: "blue" | "green" | "amber" | "red";
}) {
  const colorStyles = {
    blue: {
      icon: "bg-blue-100 text-blue-700",
      value: "text-blue-700",
      accent: "bg-blue-500",
    },
    green: {
      icon: "bg-green-100 text-green-700",
      value: "text-green-700",
      accent: "bg-green-500",
    },
    amber: {
      icon: "bg-amber-100 text-amber-700",
      value: "text-amber-700",
      accent: "bg-amber-500",
    },
    red: {
      icon: "bg-red-100 text-red-700",
      value: "text-red-700",
      accent: "bg-red-500",
    },
  };

  const styles = colorStyles[color];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#dce5f1] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h2 className={`mt-3 break-words text-2xl font-bold ${styles.value}`}>
            {value}
          </h2>

          <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${styles.icon}`}
        >
          {icon}
        </div>
      </div>

      <div className={`absolute bottom-0 left-0 h-1 w-full ${styles.accent}`} />
    </div>
  );
}
