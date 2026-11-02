
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
        return "bg-green-500/10 text-green-400";
      case "FLAGGED":
        return "bg-orange-500/10 text-orange-400";
      case "FAILED":
        return "bg-red-500/10 text-red-400";
      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-slate-100 md:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="mb-4 inline-block text-sm text-blue-400 hover:underline"
          >
            â† Back to Dashboard
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
          value={loading ? "..." : filteredInvoices.length.toString()}
        />

        <SummaryCard
          title="Verified Invoices"
          value={loading ? "..." : verifiedCount.toString()}
        />

        <SummaryCard
          title="Total Invoice Amount"
          value={
            loading
              ? "..."
              : formatAmount(totalAmount, "INR")
          }
        />
      </section>

      {/* Validation Feedback */}
      {validationSuccess && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
          {validationSuccess}
        </div>
      )}

      {validationError && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {validationError}
        </div>
      )}

      {/* Invoice Table */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            All Invoices
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Search, filter and validate invoice records.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            placeholder="Search by invoice ID, invoice number or vendor..."
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
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Duplicate">Duplicate</option>
            <option value="Rejected">Rejected</option>
            <option value="Flagged">Flagged</option>
          </select>
        </div>

        {loading && (
          <p className="py-10 text-center text-blue-400">
            Loading invoices from database...
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-4">Invoice ID</th>
                    <th className="px-4 py-4">Vendor</th>
                    <th className="px-4 py-4">Invoice Date</th>
                    <th className="px-4 py-4">Amount</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInvoices.map((invoice) => {
                    const result = validationResults[invoice.invoice_id];

                    return (
                      <tr
                        key={invoice.invoice_id}
                        className="border-b border-slate-800 hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-5 font-medium text-blue-400">
                          {invoice.invoice_number}
                        </td>

                        <td className="px-4 py-5">
                          {getVendorName(invoice.vendor_id)}
                        </td>

                        <td className="px-4 py-5 text-slate-400">
                          {invoice.invoice_date}
                        </td>

                        <td className="px-4 py-5 font-medium">
                          {formatAmount(
                            invoice.total_amount,
                            invoice.currency
                          )}
                        </td>

                        <td className="px-4 py-5">
                          <StatusBadge
                            status={getStatusLabel(invoice.status)}
                          />

                          {result && (
                            <div className="mt-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${getValidationStyle(
                                  result.validation_status
                                )}`}
                              >
                                {result.validation_status}
                              </span>
                              <p className="mt-1 text-xs text-slate-400">
                                Risk: {Number(result.risk_score).toFixed(2)}
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex flex-col items-start gap-3">
                            <Link
                              href={`/invoices/${invoice.invoice_id}`}
                              className="text-blue-400 hover:underline"
                            >
                              View
                            </Link>

                            <button
                              onClick={() =>
                                validateInvoice(invoice.invoice_id)
                              }
                              disabled={validatingId !== null}
                              className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {validatingId === invoice.invoice_id
                                ? "Validating..."
                                : "Validate"}
                            </button>

                            {result && (
                              <p className="max-w-[220px] text-xs text-slate-400">
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
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </p>
          </>
        )}
      </section>
    </main>
  );
}

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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Verified: "bg-green-500/10 text-green-400",
    Duplicate: "bg-red-500/10 text-red-400",
    Pending: "bg-yellow-500/10 text-yellow-400",
    Rejected: "bg-red-500/10 text-red-400",
    Flagged: "bg-orange-500/10 text-orange-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || "bg-slate-500/10 text-slate-400"
      }`}
    >
      {status}
    </span>
  );
}

