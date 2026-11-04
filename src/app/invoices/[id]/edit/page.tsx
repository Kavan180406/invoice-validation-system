
"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import API_BASE_URL, { apiFetch } from "@/lib/api";

type Invoice = {
  invoice_id: number;
  invoice_number: string;
  vendor_id: number;
  uploaded_by: number | null;
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

type InvoiceForm = {
  invoice_number: string;
  vendor_id: string;
  invoice_date: string;
  due_date: string;
  total_amount: string;
  currency: string;
  status: string;
  description: string;
};

const emptyForm: InvoiceForm = {
  invoice_number: "",
  vendor_id: "",
  invoice_date: "",
  due_date: "",
  total_amount: "",
  currency: "INR",
  status: "PENDING",
  description: "",
};

function EditInvoiceContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [originalInvoice, setOriginalInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [invoiceResponse, vendorsResponse] = await Promise.all([
          apiFetch(`${API_BASE_URL}/invoices/${id}`),
          apiFetch(`${API_BASE_URL}/vendors/`),
        ]);

        if (!invoiceResponse.ok) {
          throw new Error("Unable to find this invoice.");
        }

        if (!vendorsResponse.ok) {
          throw new Error("Unable to load vendors.");
        }

        const invoice: Invoice = await invoiceResponse.json();
        const vendorData: Vendor[] = await vendorsResponse.json();

        setOriginalInvoice(invoice);
        setVendors(vendorData);

        setForm({
          invoice_number: invoice.invoice_number,
          vendor_id: String(invoice.vendor_id),
          invoice_date: invoice.invoice_date.slice(0, 10),
          due_date: invoice.due_date.slice(0, 10),
          total_amount: String(invoice.total_amount),
          currency: invoice.currency || "INR",
          status: invoice.status || "PENDING",
          description: invoice.description || "",
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load invoice."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  function updateField(field: keyof InvoiceForm, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!originalInvoice) {
      setError("Invoice information is not loaded.");
      return;
    }

    if (form.due_date < form.invoice_date) {
      setError("Due date cannot be earlier than invoice date.");
      return;
    }

    if (
      !Number.isFinite(Number(form.total_amount)) ||
      Number(form.total_amount) <= 0
    ) {
      setError("Invoice amount must be greater than zero.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        invoice_number: form.invoice_number.trim(),
        vendor_id: Number(form.vendor_id),
        uploaded_by: originalInvoice.uploaded_by,
        invoice_date: form.invoice_date,
        due_date: form.due_date,
        total_amount: Number(form.total_amount),
        currency: form.currency,
        status: form.status,
        description: form.description.trim(),
      };

      const response = await apiFetch(`${API_BASE_URL}/invoices/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail || "Failed to update invoice."
        );
      }

      setSuccess("Invoice updated successfully!");

      setTimeout(() => {
        window.location.href = `/invoices/${id}`;
      }, 800);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    window.location.href = `/invoices/${id}`;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eaf0f8] p-6">
        <div className="rounded-2xl border border-[#dce5f1] bg-white px-10 py-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="font-semibold text-[#14243b]">Loading invoice...</p>
          <p className="mt-1 text-sm text-slate-500">
            Please wait while we retrieve the invoice information.
          </p>
        </div>
      </main>
    );
  }

  if (!originalInvoice) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eaf0f8] p-6">
        <div className="w-full max-w-lg rounded-2xl border border-[#dce5f1] bg-white p-8 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <span className="text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-bold text-[#14243b]">
            Unable to load invoice
          </h1>
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <Link
            href="/invoices"
            className="mt-6 inline-flex rounded-lg bg-[#14243b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#203957]"
          >
            Back to Invoices
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eaf0f8] px-4 py-7 text-[#14243b] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">

        {/* Back Navigation */}
        <button
          type="button"
          onClick={handleCancel}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#315b8a] transition hover:text-blue-700"
        >
          <span className="text-lg">←</span>
          Back to Invoice Details
        </button>

        {/* Page Header */}
        <div className="mb-7 overflow-hidden rounded-2xl bg-[#14243b] p-6 text-white shadow-md sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                INVOICE MANAGEMENT
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Edit Invoice
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/75">
                Update invoice information and save your changes to the database.
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 sm:min-w-44">
              <p className="text-xs font-medium uppercase tracking-wider text-blue-100/70">
                Invoice Number
              </p>
              <p className="mt-1 break-all text-lg font-bold text-white">
                {originalInvoice.invoice_number}
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-[#dce5f1] bg-white shadow-sm"
        >
          {/* Form Heading */}
          <div className="border-b border-[#e7edf5] bg-[#f2f6fc] px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg text-blue-700">
                ✎
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#14243b]">
                  Invoice Information
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Update the details below and save your changes.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">

            {/* Invoice Number */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#263b56]">
                Invoice Number
              </label>
              <input
                required
                value={form.invoice_number}
                onChange={(e) => updateField("invoice_number", e.target.value)}
                className="w-full rounded-xl border border-[#d7e1ee] bg-[#f8faff] px-4 py-3 text-sm text-[#14243b] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Vendor */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#263b56]">
                Vendor
              </label>
              <select
                required
                value={form.vendor_id}
                onChange={(e) => updateField("vendor_id", e.target.value)}
                className="w-full rounded-xl border border-[#d7e1ee] bg-[#f8faff] px-4 py-3 text-sm text-[#14243b] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Select a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.vendor_id} value={vendor.vendor_id}>
                    {vendor.vendor_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#263b56]">
                  Invoice Date
                </label>
                <input
                  type="date"
                  required
                  value={form.invoice_date}
                  onChange={(e) => updateField("invoice_date", e.target.value)}
                  className="w-full rounded-xl border border-[#d7e1ee] bg-[#f8faff] px-4 py-3 text-sm text-[#14243b] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#263b56]">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  min={form.invoice_date}
                  value={form.due_date}
                  onChange={(e) => updateField("due_date", e.target.value)}
                  className="w-full rounded-xl border border-[#d7e1ee] bg-[#f8faff] px-4 py-3 text-sm text-[#14243b] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Due date cannot be earlier than the invoice date.
                </p>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#263b56]">
                Invoice Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                  ₹
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={form.total_amount}
                  onChange={(e) => updateField("total_amount", e.target.value)}
                  className="w-full rounded-xl border border-[#d7e1ee] bg-[#f8faff] py-3 pl-9 pr-4 text-sm text-[#14243b] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#263b56]">
                Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Enter invoice description..."
                className="w-full resize-y rounded-xl border border-[#d7e1ee] bg-[#f8faff] px-4 py-3 text-sm text-[#14243b] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <span className="font-bold">!</span>
                <p>{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                <span className="font-bold">✓</span>
                <p>{success}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#e7edf5] pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-[#d5dfeb] bg-white px-6 py-3 text-sm font-semibold text-[#31506f] transition hover:bg-[#f2f6fc]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Changes
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          InvoiceGuard · Invoice Management
        </p>
      </div>
    </main>
  );
}

export default function EditInvoicePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#eaf0f8] p-6">
          <div className="rounded-2xl border border-[#dce5f1] bg-white px-10 py-8 text-center shadow-sm">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <p className="font-semibold text-[#14243b]">
              Loading invoice editor...
            </p>
          </div>
        </main>
      }
    >
      <EditInvoiceContent />
    </Suspense>
  );
}
