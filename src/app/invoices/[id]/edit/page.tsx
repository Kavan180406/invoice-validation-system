
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
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        Loading invoice...
      </main>
    );
  }

  if (!originalInvoice) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <h1 className="text-2xl font-bold">Unable to load invoice</h1>
        <p className="mt-3 text-red-400">{error}</p>
        <Link href="/invoices" className="mt-4 inline-block text-blue-400">
          Back to Invoices
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-slate-100 md:p-10">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-blue-400 hover:underline"
        >
          ← Back to Invoice Details
        </button>

        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold">Edit Invoice</h1>
          <p className="mt-2 text-sm text-slate-400">
            Update invoice information and save changes to the database.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <h2 className="text-lg font-semibold">Invoice Information</h2>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Invoice Number
            </label>
            <input
              required
              value={form.invoice_number}
              onChange={(e) => updateField("invoice_number", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Vendor
            </label>
            <select
              required
              value={form.vendor_id}
              onChange={(e) => updateField("vendor_id", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-blue-500"
            >
              <option value="">Select a vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.vendor_id} value={vendor.vendor_id}>
                  {vendor.vendor_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Invoice Date
              </label>
              <input
                type="date"
                required
                value={form.invoice_date}
                onChange={(e) => updateField("invoice_date", e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Due Date
              </label>
              <input
                type="date"
                required
                min={form.invoice_date}
                value={form.due_date}
                onChange={(e) => updateField("due_date", e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Invoice Amount (₹)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.total_amount}
              onChange={(e) => updateField("total_amount", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Description
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-800 bg-green-950/40 p-4 text-sm text-green-300">
              {success}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-slate-700 px-6 py-3 text-sm hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function EditInvoicePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 p-10 text-white">
          Loading invoice editor...
        </main>
      }
    >
      <EditInvoiceContent />
    </Suspense>
  );
}
