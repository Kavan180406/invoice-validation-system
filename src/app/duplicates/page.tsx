
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import API_BASE_URL, { apiFetch } from "@/lib/api";

type Invoice = {
  invoice_id: number;
  invoice_number: string;
  vendor_id: number;
  invoice_date: string;
  total_amount: number | string;
  currency: string;
};

type Vendor = {
  vendor_id: number;
  vendor_name: string;
};

type DuplicateRecord = {
  duplicate_check_id: number;
  invoice_id: number;
  matched_invoice_id: number;
  similarity_score: number;
  detection_reason: string | null;
  review_status: string;
};

type DisplayRecord = DuplicateRecord & {
  invoice_number: string;
  matched_invoice_number: string;
  vendor_name: string;
  invoice_date: string;
  amount: number;
  currency: string;
};

function formatDate(date: string) {
  if (!date) return "—";

  const datePart = date.split("T")[0];
  const parts = datePart.split("-");

  if (parts.length !== 3) return date;

  const [year, month, day] = parts;
  return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
}

export default function DuplicatesPage() {
  const [records, setRecords] = useState<DisplayRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Read the logged-in user's role.
  // Backend authorization remains the actual security control.
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const role = parsedUser.role ?? parsedUser.user?.role;

        setIsAdmin(
          typeof role === "string" &&
          role.toUpperCase() === "ADMIN"
        );
      }
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const fetchDuplicateData = useCallback(async () => {
    try {
      setLoading(true);

      const [duplicatesResponse, invoicesResponse, vendorsResponse] =
        await Promise.all([
          apiFetch(`${API_BASE_URL}/duplicates/`),
          apiFetch(`${API_BASE_URL}/invoices/`),
          apiFetch(`${API_BASE_URL}/vendors/`),
        ]);

      if (!duplicatesResponse.ok) {
        throw new Error("Unable to load duplicate records.");
      }

      if (!invoicesResponse.ok) {
        throw new Error("Unable to load invoices.");
      }

      if (!vendorsResponse.ok) {
        throw new Error("Unable to load vendors.");
      }

      const duplicates: DuplicateRecord[] =
        await duplicatesResponse.json();

      const invoiceData: Invoice[] =
        await invoicesResponse.json();

      const vendors: Vendor[] =
        await vendorsResponse.json();

      setInvoices(invoiceData);

      const mappedRecords: DisplayRecord[] = duplicates
        .map((record) => {
          const invoice = invoiceData.find(
            (item) => item.invoice_id === record.invoice_id
          );

          const matchedInvoice = invoiceData.find(
            (item) => item.invoice_id === record.matched_invoice_id
          );

          const vendor = invoice
            ? vendors.find(
                (item) => item.vendor_id === invoice.vendor_id
              )
            : undefined;

          if (!invoice || !matchedInvoice) return null;

          return {
            ...record,
            invoice_number: invoice.invoice_number,
            matched_invoice_number: matchedInvoice.invoice_number,
            vendor_name: vendor?.vendor_name ?? "Unknown Vendor",
            invoice_date: invoice.invoice_date,
            amount: Number(invoice.total_amount),
            currency: invoice.currency,
          };
        })
        .filter((record): record is DisplayRecord => record !== null);

      setRecords(mappedRecords);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load duplicate records."
      );
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDuplicateData();
  }, [fetchDuplicateData]);

  async function handleDetection() {
    if (!selectedInvoice) {
      setMessage("Please select an invoice first.");
      setSuccess(false);
      return;
    }

    try {
      setDetecting(true);
      setMessage("");

      const response = await apiFetch(
        `${API_BASE_URL}/duplicates/${selectedInvoice}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Duplicate detection failed."
        );
      }

      const results: DuplicateRecord[] = await response.json();

      setSuccess(true);
      setMessage(
        results.length > 0
          ? `${results.length} potential duplicate match(es) detected successfully.`
          : "Detection completed. No duplicate matches found."
      );

      await fetchDuplicateData();
    } catch (error) {
      setSuccess(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Duplicate detection failed."
      );
    } finally {
      setDetecting(false);
    }
  }

  // Admin confirms or dismisses a potential duplicate.
  async function handleReview(
    duplicateCheckId: number,
    action: "confirm" | "dismiss"
  ) {
    const actionLabel =
      action === "confirm" ? "confirm this duplicate" : "dismiss this match";

    if (!window.confirm(`Are you sure you want to ${actionLabel}?`)) {
      return;
    }

    try {
      setReviewingId(duplicateCheckId);
      setMessage("");

      const response = await apiFetch(
        `${API_BASE_URL}/duplicates/${duplicateCheckId}/${action}`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail || `Unable to ${action} duplicate.`
        );
      }

      const result = await response.json();

      setSuccess(true);
      setMessage(
        action === "confirm"
          ? `Duplicate confirmed. Invoice ${result.invoice_id} is now marked DUPLICATE.`
          : `Potential duplicate dismissed. Invoice status remains unchanged.`
      );

      await fetchDuplicateData();
    } catch (error) {
      setSuccess(false);
      setMessage(
        error instanceof Error
          ? error.message
          : `Unable to ${action} duplicate.`
      );
    } finally {
      setReviewingId(null);
    }
  }

  const filteredRecords = records.filter((record) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      record.invoice_number.toLowerCase().includes(searchValue) ||
      record.matched_invoice_number.toLowerCase().includes(searchValue) ||
      record.vendor_name.toLowerCase().includes(searchValue);

    const matchesFilter =
      filter === "All" || record.review_status === filter;

    return matchesSearch && matchesFilter;
  });

  const confirmedCount = records.filter(
    (record) => record.review_status === "CONFIRMED"
  ).length;

  const reviewCount = records.filter(
    (record) => record.review_status === "UNDER_REVIEW"
  ).length;

  const totalAmount = records.reduce(
    (sum, record) => sum + record.amount,
    0
  );

  return (
    <main className="min-h-screen bg-[#eaf0f8] px-4 py-7 text-[#14243b] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#315b8a] transition hover:text-blue-700"
        >
          <span className="text-lg">←</span>
          Back to Dashboard
        </Link>

        {/* Page Header */}
        <div className="mb-7 mt-6 overflow-hidden rounded-2xl bg-[#14243b] p-6 text-white shadow-md sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                INVOICEGUARD ANALYSIS
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Duplicate Detection
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/75">
                Identify and review potentially duplicated invoices before
                payment approval.
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/10 px-5 py-4 sm:min-w-44">
              <p className="text-xs font-medium uppercase tracking-wider text-blue-100/70">
                Flagged Records
              </p>
              <p className="mt-1 text-3xl font-bold text-white">
                {loading ? "..." : records.length}
              </p>
              <p className="mt-1 text-xs text-blue-100/70">
                Potential duplicate matches
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Flagged"
            value={loading ? "..." : records.length.toString()}
            subtitle="All detected matches"
            icon="◈"
            color="blue"
          />

          <SummaryCard
            title="Confirmed Duplicates"
            value={loading ? "..." : confirmedCount.toString()}
            subtitle="Confirmed review status"
            icon="!"
            color="red"
          />

          <SummaryCard
            title="Under Review"
            value={loading ? "..." : reviewCount.toString()}
            subtitle="Awaiting review"
            icon="◷"
            color="amber"
          />

          <SummaryCard
            title="Flagged Amount"
            value={
              loading
                ? "..."
                : `₹${totalAmount.toLocaleString("en-IN")}`
            }
            subtitle="Total amount of flagged records"
            icon="₹"
            color="purple"
          />
        </div>

        {/* Detection Overview */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-[#dce5f1] bg-white shadow-sm">
          <div className="flex items-start gap-4 p-5 sm:p-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl text-blue-700">
              i
            </div>

            <div>
              <h2 className="font-bold text-[#14243b]">
                Duplicate Detection Overview
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Invoices are compared using vendor information, invoice
                numbers and invoice amounts. Matches with a similarity
                score of 60% or higher are flagged for review before
                payment approval.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  Vendor matching
                </span>
                <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  Invoice number
                </span>
                <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  Invoice amount
                </span>
                <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  60% similarity threshold
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Run Duplicate Detection */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-[#dce5f1] bg-white shadow-sm">
          <div className="border-b border-[#e7edf5] bg-[#f2f6fc] px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg text-blue-700">
                ↻
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#14243b]">
                  Run Duplicate Detection
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Select an invoice to check for potential duplicates.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedInvoice}
                onChange={(e) => setSelectedInvoice(e.target.value)}
                disabled={loading || invoices.length === 0}
                className="min-w-0 flex-1 rounded-xl border border-[#d7e1ee] bg-[#f8faff] px-4 py-3 text-sm text-[#14243b] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Select an invoice</option>

                {invoices.map((invoice) => (
                  <option
                    key={invoice.invoice_id}
                    value={invoice.invoice_id}
                  >
                    {invoice.invoice_number}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleDetection}
                disabled={detecting || loading || invoices.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {detecting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Detecting...
                  </>
                ) : (
                  <>
                    Detect Duplicates
                    <span>→</span>
                  </>
                )}
              </button>
            </div>

            {message && (
              <div
                className={`mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm ${
                  success
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <span className="font-bold">
                  {success ? "✓" : "!"}
                </span>
                <p>{message}</p>
              </div>
            )}
          </div>
        </section>

        {/* Flagged Invoices */}
        <section className="overflow-hidden rounded-2xl border border-[#dce5f1] bg-white shadow-sm">

          <div className="border-b border-[#e7edf5] bg-[#f2f6fc] px-5 py-5 sm:px-7">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold text-[#14243b]">
                  Flagged Invoices
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Review potential duplicate matches and their confidence scores.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    ⌕
                  </span>
                  <input
                    type="text"
                    placeholder="Search invoice or vendor..."
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
                  <option value="All">All Statuses</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {loading ? (
              <div className="py-14 text-center">
                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                <p className="font-semibold text-[#31506f]">
                  Loading duplicate records...
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Retrieving duplicate information from the database.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#e7edf5] text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-4 font-semibold">Invoice</th>
                      <th className="px-4 py-4 font-semibold">Vendor</th>
                      <th className="px-4 py-4 font-semibold">Matched Invoice</th>
                      <th className="px-4 py-4 font-semibold">Match Reason</th>
                      <th className="px-4 py-4 font-semibold">Confidence</th>
                      <th className="px-4 py-4 font-semibold">Amount</th>
                      <th className="px-4 py-4 font-semibold">Status</th>
                      <th className="px-4 py-4 font-semibold">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr
                        key={record.duplicate_check_id}
                        className="border-b border-[#edf1f7] transition last:border-0 hover:bg-[#f8faff]"
                      >
                        <td className="px-4 py-5">
                          <p className="font-semibold text-blue-700">
                            {record.invoice_number}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(record.invoice_date)}
                          </p>
                        </td>

                        <td className="px-4 py-5 font-medium text-[#31506f]">
                          {record.vendor_name}
                        </td>

                        <td className="px-4 py-5 font-semibold text-blue-700">
                          {record.matched_invoice_number}
                        </td>

                        <td className="max-w-xs px-4 py-5 text-slate-600">
                          {record.detection_reason || "Not specified"}
                        </td>

                        <td className="px-4 py-5">
                          <div className="min-w-24">
                            <span className="font-bold text-[#14243b]">
                              {Number(record.similarity_score)}%
                            </span>
                            <div className="mt-2 h-1.5 w-20 overflow-hidden rounded-full bg-[#e7edf5]">
                              <div
                                className="h-full rounded-full bg-blue-600"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      Number(record.similarity_score)
                                    )
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-5 font-semibold text-[#14243b]">
                          {record.currency}{" "}
                          {record.amount.toLocaleString("en-IN")}
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                              record.review_status === "CONFIRMED"
                                ? "bg-red-50 text-red-700"
                                : record.review_status === "DISMISSED"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {record.review_status.replace("_", " ")}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          {isAdmin &&
                          record.review_status === "UNDER_REVIEW" ? (
                            <div className="flex min-w-40 flex-col gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleReview(
                                    record.duplicate_check_id,
                                    "confirm"
                                  )
                                }
                                disabled={reviewingId !== null}
                                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {reviewingId === record.duplicate_check_id
                                  ? "Processing..."
                                  : "Confirm Duplicate"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleReview(
                                    record.duplicate_check_id,
                                    "dismiss"
                                  )
                                }
                                disabled={reviewingId !== null}
                                className="rounded-lg border border-[#d7e1ee] bg-white px-3 py-2 text-xs font-semibold text-[#31506f] transition hover:bg-[#edf3fb] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Dismiss Match
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {record.review_status === "CONFIRMED"
                                ? "Reviewed"
                                : record.review_status === "DISMISSED"
                                  ? "Dismissed"
                                  : "Admin review"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {filteredRecords.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-14 text-center"
                        >
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf3fb] text-xl text-[#315b8a]">
                            ◈
                          </div>

                          <p className="font-semibold text-[#31506f]">
                            {records.length === 0
                              ? "No duplicate records found."
                              : "No matching records found."}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {records.length === 0
                              ? "Run duplicate detection to get started."
                              : "Try changing your search or status filter."}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf1f7] pt-4">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-[#31506f]">
                  {filteredRecords.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#31506f]">
                  {records.length}
                </span>{" "}
                flagged records
              </p>

              <p className="text-xs text-slate-400">
                InvoiceGuard Duplicate Detection
              </p>
            </div>
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
  color: "blue" | "red" | "amber" | "purple";
}) {
  const colorStyles = {
    blue: {
      icon: "bg-blue-100 text-blue-700",
      value: "text-blue-700",
      accent: "bg-blue-500",
    },
    red: {
      icon: "bg-red-100 text-red-700",
      value: "text-red-700",
      accent: "bg-red-500",
    },
    amber: {
      icon: "bg-amber-100 text-amber-700",
      value: "text-amber-700",
      accent: "bg-amber-500",
    },
    purple: {
      icon: "bg-purple-100 text-purple-700",
      value: "text-purple-700",
      accent: "bg-purple-500",
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
