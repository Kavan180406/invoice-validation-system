
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import API_BASE_URL from "@/lib/api";

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

export default function InvoiceDetails() {
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
            fetch(`${API_BASE_URL}/invoices/${id}`),
            fetch(`${API_BASE_URL}/vendors/`),
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

      const response = await fetch(
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
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        Loading invoice details...
      </main>
    );
  }

  if (error && !invoice) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <h1 className="text-2xl font-bold">
          Unable to load invoice
        </h1>

        <p className="mt-3 text-red-400">{error}</p>

        <Link
          href="/invoices"
          className="mt-4 inline-block text-blue-400 hover:underline"
        >
          Back to Invoices
        </Link>
      </main>
    );
  }

  if (!invoice) return null;

  const statusStyle =
    invoice.status === "VERIFIED"
      ? "bg-green-500/10 text-green-400"
      : invoice.status === "DUPLICATE"
      ? "bg-red-500/10 text-red-400"
      : "bg-yellow-500/10 text-yellow-400";

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-slate-100 md:p-10">
      <div className="mx-auto max-w-4xl">

        <Link
          href="/invoices"
          className="text-sm text-blue-400 hover:underline"
        >
          ← Back to Invoices
        </Link>

        <div className="mb-8 mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Invoice Details
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Complete information about this invoice.
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${statusStyle}`}
          >
            {invoice.status}
          </span>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">

          <div className="mb-6 border-b border-slate-800 pb-5">
            <p className="text-sm text-slate-400">
              Invoice Number
            </p>

            <h2 className="mt-2 text-2xl font-bold text-blue-400">
              {invoice.invoice_number}
            </h2>
          </div>

          <h3 className="mb-5 text-lg font-semibold">
            General Information
          </h3>

          <div className="grid gap-6 sm:grid-cols-2">
            <Detail label="Vendor Name" value={vendorName} />

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

          <div className="mt-8 border-t border-slate-800 pt-6">
            <h3 className="mb-3 text-lg font-semibold">
              Description
            </h3>

            <p className="text-sm leading-7 text-slate-400">
              {invoice.description || "No description provided."}
            </p>
          </div>

        </section>

        {invoice.status === "DUPLICATE" && (
          <section className="mt-6 rounded-xl border border-red-900 bg-red-950/20 p-5">
            <h3 className="font-semibold text-red-400">
              Duplicate Invoice Alert
            </h3>

            <p className="mt-2 text-sm text-slate-300">
              This invoice has been flagged as a potential duplicate.
              Please review it before approving payment.
            </p>
          </section>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">

          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              window.location.href = `/invoices/${id}/edit`;
            }}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
          >
            Edit Invoice
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Invoice"}
          </button>

          <Link
            href="/invoices"
            className="rounded-lg border border-slate-700 px-5 py-3 text-sm hover:bg-slate-800"
          >
            Back to Invoice Management
          </Link>

        </div>

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
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}
