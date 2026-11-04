
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import API_BASE_URL from "@/lib/api";
import { apiFetch } from "@/lib/api";

type Invoice = {
  invoice_id: number;
  invoice_number: string;
  vendor_id: number;
  uploaded_by: number | null;
  invoice_date: string;
  due_date: string | null;
  total_amount: number | string;
  currency: string;
  status: string;
  description: string | null;
};

type Vendor = {
  vendor_id: number;
  vendor_name: string;
};

type ValidationResult = {
  validation_id: number;
  invoice_id: number;
  validated_by: number | null;
  validation_status: string;
  risk_score: number | string;
  validation_message: string | null;
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  DUPLICATE: "Duplicate",
  REJECTED: "Rejected",
  FLAGGED: "Flagged",
};

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [validationResults, setValidationResults] = useState<
    Record<number, ValidationResult>
  >({});
  const [validationError, setValidationError] = useState("");
  const [validationSuccess, setValidationSuccess] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [invoiceResponse, vendorResponse] = await Promise.all([
          apiFetch(`${API_BASE_URL}/invoices/`),
          apiFetch(`${API_BASE_URL}/vendors/`),
        ]);

        if (!invoiceResponse.ok) {
          throw new Error("Failed to fetch invoices.");
        }

        if (!vendorResponse.ok) {
          throw new Error("Failed to fetch vendors.");
        }

        const invoiceData: Invoice[] = await invoiceResponse.json();
        const vendorData: Vendor[] = await vendorResponse.json();

        setInvoices(invoiceData);
        setVendors(vendorData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading invoices."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const vendorMap = useMemo(() => {
    return new Map(
      vendors.map((vendor) => [
        vendor.vendor_id,
        vendor.vendor_name,
      ])
    );
  }, [vendors]);

  const getVendorName = (vendorId: number) => {
    return vendorMap.get(vendorId) || `Vendor #${vendorId}`;
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status.toUpperCase()] || status;
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const vendorName = getVendorName(invoice.vendor_id);

      const matchesSearch =
        invoice.invoice_number
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        vendorName.toLowerCase().includes(search.toLowerCase()) ||
        invoice.invoice_id.toString().includes(search);

      const matchesStatus =
        filter === "All" ||
        getStatusLabel(invoice.status) === filter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, vendors, search, filter]);

  const totalAmount = filteredInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.total_amount),
    0
  );

  const verifiedCount = filteredInvoices.filter(
    (invoice) => getStatusLabel(invoice.status) === "Verified"
  ).length;

  // Display dates consistently in DD-MM-YYYY format.
  // Original database date format remains unchanged.
  const formatDate = (date: string | null) => {
    if (!date) return "—";

    const datePart = date.split("T")[0];
    const parts = datePart.split("-");

    if (parts.length !== 3) return date;

    const [year, month, day] = parts;

    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
  };

  const formatAmount = (amount: number | string, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount));
  };

  const validateInvoice = async (invoiceId: number) => {
    try {
      setValidatingId(invoiceId);
      setValidationError("");
      setValidationSuccess("");

      const response = await apiFetch(
        `${API_BASE_URL}/validations/${invoiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Invoice validation failed."
        );
      }

      const result: ValidationResult = data;

      setValidationResults((previous) => ({
        ...previous,
        [invoiceId]: result,
      }));

      setValidationSuccess(
        `Invoice ${invoiceId} validated successfully.`
      );
    } catch (err) {
      setValidationError(
        err instanceof Error
          ? err.message
          : "Something went wrong during validation."
      );
    } finally {
      setValidatingId(null);
    }
  };

  const getValidationStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case "PASSED":
        return "bg-green-100 text-green-800 ring-green-200";
      case "FLAGGED":
        return "bg-orange-100 text-orange-800 ring-orange-200";
      case "FAILED":
        return "bg-red-100 text-red-800 ring-red-200";
      default:
        return "bg-slate-100 text-slate-700 ring-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#eaf0f8] text-slate-800">

      {/* Header */}
      <header className="border-b border-slate-700 bg-[#14243b] px-5 py-5 text-white md:px-9">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">

          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-blue-300 transition hover:text-white"
            >
              <span>←</span>
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-xl font-bold shadow-lg shadow-blue-950/30">
                I
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Invoice Management
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Manage, search and review all submitted invoices.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/invoices/new"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-950/20 transition hover:bg-blue-500"
          >
            + Add Invoice
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-5 py-7 md:px-9 md:py-9">

        {/* Summary Cards */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <SummaryCard
            title="Total Invoices"
            value={loading ? "..." : filteredInvoices.length.toString()}
            subtitle="Matching invoice records"
            symbol="▤"
            accent="blue"
          />

          <SummaryCard
            title="Verified Invoices"
            value={loading ? "..." : verifiedCount.toString()}
            subtitle="Successfully verified"
            symbol="✓"
            accent="green"
          />

          <SummaryCard
            title="Total Invoice Amount"
            value={
              loading
                ? "..."
                : formatAmount(totalAmount, "INR")
            }
            subtitle="Combined filtered invoice value"
            symbol="₹"
            accent="amber"
          />

        </section>

        {/* Validation Feedback */}
        {validationSuccess && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-green-200 bg-[#e7f3ed] p-4 text-sm font-medium text-green-800">
            <span className="text-lg">✓</span>
            {validationSuccess}
          </div>
        )}

        {validationError && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-[#fff0ef] p-4 text-sm font-medium text-red-800">
            <span className="text-lg">!</span>
            {validationError}
          </div>
        )}

        {/* Invoice Table */}
        <section className="overflow-hidden rounded-2xl border border-[#d4deec] bg-[#f8faff] shadow-sm shadow-slate-300/40">

          {/* Section Heading */}
          <div className="border-b border-[#dce5f0] bg-[#f2f6fc] px-5 py-5 md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg text-blue-700">
                ▤
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#172b46]">
                  All Invoices
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Search, filter and validate invoice records.
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-3 border-b border-[#dce5f0] px-5 py-5 md:flex-row md:px-6">

            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search by invoice ID, invoice number or vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#d6e0ed] bg-[#edf3fb] py-3 pl-9 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-[#d6e0ed] bg-[#edf3fb] px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Duplicate">Duplicate</option>
              <option value="Rejected">Rejected</option>
              <option value="Flagged">Flagged</option>
            </select>

          </div>

          {/* Loading */}
          {loading && (
            <div className="py-14 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <p className="text-sm font-medium text-blue-700">
                Loading invoices from database...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Invoice Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">

                  <thead className="border-y border-[#dce5f0] bg-[#e9f0f9] text-[11px] uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="px-5 py-4 font-bold">Invoice ID</th>
                      <th className="px-5 py-4 font-bold">Vendor</th>
                      <th className="px-5 py-4 font-bold">Invoice Date</th>
                      <th className="px-5 py-4 font-bold">Amount</th>
                      <th className="px-5 py-4 font-bold">Status</th>
                      <th className="px-5 py-4 font-bold">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#e2e9f2]">

                    {filteredInvoices.map((invoice) => {
                      const result = validationResults[invoice.invoice_id];

                      return (
                        <tr
                          key={invoice.invoice_id}
                          className="transition hover:bg-[#edf4fd]"
                        >

                          <td className="px-5 py-5 font-semibold text-blue-700">
                            {invoice.invoice_number}
                          </td>

                          <td className="px-5 py-5 text-slate-700">
                            {getVendorName(invoice.vendor_id)}
                          </td>

                          <td className="px-5 py-5 text-slate-500">
                            {formatDate(invoice.invoice_date)}
                          </td>

                          <td className="px-5 py-5 font-semibold text-slate-800">
                            {formatAmount(
                              invoice.total_amount,
                              invoice.currency
                            )}
                          </td>

                          <td className="px-5 py-5">
                            <StatusBadge
                              status={getStatusLabel(invoice.status)}
                            />

                            {result && (
                              <div className="mt-3 space-y-2">

                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getValidationStyle(
                                    result.validation_status
                                  )}`}
                                >
                                  {result.validation_status}
                                </span>

                                <p className="text-xs font-medium text-slate-500">
                                  Risk Score:{" "}
                                  <span className="font-bold text-slate-700">
                                    {Number(result.risk_score).toFixed(2)}
                                  </span>
                                </p>

                              </div>
                            )}
                          </td>

                          <td className="px-5 py-5">
                            <div className="flex flex-col items-start gap-3">

                              <Link
                                href={`/invoices/${invoice.invoice_id}`}
                                className="text-sm font-semibold text-blue-700 transition hover:text-blue-900 hover:underline"
                              >
                                View Details →
                              </Link>

                              <button
                                onClick={() =>
                                  validateInvoice(invoice.invoice_id)
                                }
                                disabled={validatingId !== null}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {validatingId === invoice.invoice_id
                                  ? "Validating..."
                                  : "Validate"}
                              </button>

                              {result && (
                                <p className="max-w-[220px] text-xs leading-5 text-slate-500">
                                  {result.validation_message}
                                </p>
                              )}

                            </div>
                          </td>

                        </tr>
                      );
                    })}

                    {filteredInvoices.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 text-center text-sm text-slate-500"
                        >
                          <div className="mb-2 text-2xl text-slate-300">
                            ▤
                          </div>
                          No invoices found.
                        </td>
                      </tr>
                    )}

                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dce5f0] bg-[#f2f6fc] px-5 py-4 md:px-6">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-bold text-slate-700">
                    {filteredInvoices.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-slate-700">
                    {invoices.length}
                  </span>{" "}
                  invoices
                </p>

                <Link
                  href="/"
                  className="text-sm font-bold text-blue-700 transition hover:text-blue-900"
                >
                  ← Dashboard
                </Link>
              </div>
            </>
          )}
        </section>

        <footer className="mt-8 pb-3 text-center text-xs text-slate-500">
          InvoiceGuard © 2026 | Invoice Validation & Duplicate Detection System
        </footer>

      </main>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  symbol,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  symbol: string;
  accent: "blue" | "green" | "amber";
}) {
  const accentStyles = {
    blue: {
      card: "bg-[#e4edfa] border-blue-200",
      icon: "bg-blue-100 text-blue-700",
      line: "bg-blue-600",
      value: "text-[#173b6b]",
    },
    green: {
      card: "bg-[#e7f3ed] border-green-200",
      icon: "bg-green-100 text-green-700",
      line: "bg-green-600",
      value: "text-[#155c3b]",
    },
    amber: {
      card: "bg-[#f8f0df] border-amber-200",
      icon: "bg-amber-100 text-amber-700",
      line: "bg-amber-500",
      value: "text-[#80520b]",
    },
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${accentStyles[accent].card}`}
    >
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">
          {title}
        </p>

        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${accentStyles[accent].icon}`}
        >
          {symbol}
        </span>
      </div>

      <h2
        className={`mt-3 break-words text-2xl font-bold tracking-tight ${accentStyles[accent].value}`}
      >
        {value}
      </h2>

      <p className="mt-2 text-xs font-medium text-slate-500">
        {subtitle}
      </p>

      <div
        className={`absolute bottom-0 left-0 h-1 w-full ${accentStyles[accent].line}`}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Verified: "bg-green-100 text-green-800 ring-green-200",
    Duplicate: "bg-red-100 text-red-800 ring-red-200",
    Pending: "bg-amber-100 text-amber-800 ring-amber-200",
    Rejected: "bg-red-100 text-red-800 ring-red-200",
    Flagged: "bg-orange-100 text-orange-800 ring-orange-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[status] || "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {status}
    </span>
  );
}
