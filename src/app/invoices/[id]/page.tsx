
"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import API_BASE_URL, { apiFetch } from "@/lib/api";

type Invoice = {
  invoice_id: number;
  invoice_number: string;
  vendor_id: number;
  invoice_date: string;
  due_date: string;
  total_amount: number | string;
  currency: string;
  status: string;
  description: string | null;
};

type Vendor = {
  vendor_id: number;
  vendor_name: string;
};

function formatDate(date: string) {
  if (!date) return "—";

  const parts = date.split("-");
  if (parts.length !== 3) return date;

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function InvoiceDetailsContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [vendorName, setVendorName] = useState("Unknown Vendor");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchInvoiceDetails() {
      try {
        setLoading(true);
        setError("");

        const [invoiceResponse, vendorsResponse] =
          await Promise.all([
            apiFetch(`${API_BASE_URL}/invoices/${id}`),
            apiFetch(`${API_BASE_URL}/vendors/`),
          ]);

        if (!invoiceResponse.ok) {
          throw new Error("Invoice not found.");
        }

        if (!vendorsResponse.ok) {
          throw new Error("Unable to load vendor information.");
        }

        const invoiceData: Invoice =
          await invoiceResponse.json();

        const vendors: Vendor[] =
          await vendorsResponse.json();

        const vendor = vendors.find(
          (item) => item.vendor_id === invoiceData.vendor_id
        );

        setInvoice(invoiceData);
        setVendorName(
          vendor?.vendor_name ?? "Unknown Vendor"
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load invoice details."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchInvoiceDetails();
  }, [id]);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete invoice ${invoice?.invoice_number}?`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      const response = await apiFetch(
        `${API_BASE_URL}/invoices/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail || "Unable to delete invoice."
        );
      }

      window.alert("Invoice deleted successfully!");
      window.location.href = "/invoices";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while deleting the invoice."
      );

      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eaf0f8] p-6">
        <div className="w-full max-w-md rounded-2xl border border-[#d4deec] bg-[#f8faff] p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <h2 className="font-semibold text-[#172b46]">
            Loading Invoice Details
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Fetching invoice information...
          </p>
        </div>
      </main>
    );
  }

  if (error && !invoice) {
    return (
      <main className="min-h-screen bg-[#eaf0f8] p-6 md:p-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-[#fff7f7] p-7 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-xl font-bold text-red-700">
            !
          </div>

          <h1 className="text-2xl font-bold text-[#172b46]">
            Unable to Load Invoice
          </h1>

          <p className="mt-3 text-sm text-red-700">
            {error}
          </p>

          <Link
            href="/invoices"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            ← Back to Invoices
          </Link>
        </div>
      </main>
    );
  }

  if (!invoice) return null;

  const statusStyle =
    invoice.status === "VERIFIED"
      ? "border-green-200 bg-green-100 text-green-800"
      : invoice.status === "DUPLICATE"
      ? "border-red-200 bg-red-100 text-red-800"
      : "border-amber-200 bg-amber-100 text-amber-800";

  return (
    <main className="min-h-screen bg-[#eaf0f8] text-slate-800">

      {/* Navy Header */}
      <header className="border-b border-slate-700 bg-[#14243b] px-5 py-6 text-white md:px-9">
        <div className="mx-auto max-w-5xl">

          <Link
            href="/invoices"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-blue-300 transition hover:text-white"
          >
            ← Back to Invoices
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-xl font-bold shadow-lg shadow-blue-950/30">
                ▤
              </div>

              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-blue-300">
                  Invoice Management
                </p>

                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Invoice Details
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Complete information about this invoice.
                </p>
              </div>
            </div>

            <span
              className={`rounded-full border px-4 py-2 text-sm font-bold ${statusStyle}`}
            >
              {invoice.status}
            </span>

          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 md:px-9">

        {/* Invoice Number Card */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-blue-200 bg-[#e4edfa] shadow-sm">

          <div className="flex flex-wrap items-center justify-between gap-4 p-6">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Invoice Number
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#173b6b] md:text-3xl">
                {invoice.invoice_number}
              </h2>

              <p className="mt-2 text-xs text-slate-500">
                Database Invoice ID: #{invoice.invoice_id}
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-[#f8faff] px-5 py-4">
              <p className="text-xs font-semibold text-slate-500">
                Invoice Amount
              </p>

              <p className="mt-2 text-xl font-bold text-blue-700">
                {invoice.currency}{" "}
                {Number(invoice.total_amount).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

          </div>
        </section>

        {/* General Information */}
        <section className="overflow-hidden rounded-2xl border border-[#d4deec] bg-[#f8faff] shadow-sm shadow-slate-300/40">

          <div className="border-b border-[#dce5f0] bg-[#f2f6fc] px-5 py-5 md:px-7">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg text-blue-700">
                ▤
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#172b46]">
                  General Information
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Invoice details retrieved from the database.
                </p>
              </div>

            </div>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 md:p-7">

            <Detail
              label="Vendor Name"
              value={vendorName}
            />

            <Detail
              label="Invoice Date"
              value={formatDate(invoice.invoice_date)}
            />

            <Detail
              label="Due Date"
              value={formatDate(invoice.due_date)}
            />

            <Detail
              label="Invoice Amount"
              value={`${invoice.currency} ${Number(
                invoice.total_amount
              ).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
            />

            <Detail
              label="Invoice Status"
              value={invoice.status}
            />

            <Detail
              label="Database Invoice ID"
              value={String(invoice.invoice_id)}
            />

          </div>

          {/* Description */}
          <div className="border-t border-[#dce5f0] p-5 md:p-7">

            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                ≡
              </div>

              <h3 className="text-base font-bold text-[#172b46]">
                Description
              </h3>
            </div>

            <div className="rounded-xl border border-[#d6e0ed] bg-[#edf3fb] p-4">
              <p className="text-sm leading-7 text-slate-600">
                {invoice.description || "No description provided."}
              </p>
            </div>

          </div>

        </section>

        {/* Duplicate Invoice Alert */}
        {invoice.status === "DUPLICATE" && (
          <section className="mt-6 rounded-2xl border border-red-200 bg-[#fff0ef] p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-lg font-bold text-red-700">
                !
              </div>

              <div>
                <h3 className="font-bold text-red-800">
                  Duplicate Invoice Alert
                </h3>

                <p className="mt-2 text-sm leading-6 text-red-700">
                  This invoice has been flagged as a potential duplicate.
                  Please review it before approving payment.
                </p>
              </div>

            </div>
          </section>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-[#fff0ef] p-4 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <section className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#d4deec] bg-[#f8faff] p-5 shadow-sm">

          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              window.location.href = `/invoices/${id}/edit`;
            }}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-900/15 transition hover:bg-blue-700 disabled:opacity-50"
          >
            Edit Invoice
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Invoice"}
          </button>

          <Link
            href="/invoices"
            className="rounded-xl border border-[#d6e0ed] bg-[#edf3fb] px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#e2ebf7]"
          >
            Back to Invoice Management
          </Link>

        </section>

        <footer className="mt-8 pb-3 text-center text-xs text-slate-500">
          InvoiceGuard © 2026 | Invoice Validation & Duplicate Detection System
        </footer>

      </div>
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#d6e0ed] bg-[#edf3fb] p-4 transition hover:border-blue-200">

      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-[#172b46]">
        {value}
      </p>

    </div>
  );
}

export default function InvoiceDetails() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#eaf0f8] p-6">
          <div className="rounded-2xl border border-[#d4deec] bg-[#f8faff] p-8 text-center shadow-sm">
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <p className="text-sm font-semibold text-[#172b46]">
              Loading invoice details...
            </p>
          </div>
        </main>
      }
    >
      <InvoiceDetailsContent />
    </Suspense>
  );
}
