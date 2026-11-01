
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import API_BASE_URL from "@/lib/api";

type Vendor = {
  vendor_id: number;
  vendor_name: string;
  is_active: boolean;
};

export default function AddInvoicePage() {
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    invoiceNumber: "",
    vendorId: "",
    invoiceDate: "",
    dueDate: "",
    amount: "",
    description: "",
  });

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch active vendors from FastAPI
  useEffect(() => {
    async function fetchVendors() {
      try {
        setLoadingVendors(true);

        const response = await fetch(`${API_BASE_URL}/vendors/`);

        if (!response.ok) {
          throw new Error("Unable to load vendors.");
        }

        const data: Vendor[] = await response.json();

        setVendors(data.filter((vendor) => vendor.is_active));
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to load vendors."
        );
      } finally {
        setLoadingVendors(false);
      }
    }

    fetchVendors();
  }, []);

  // Update form fields
  function updateField(field: string, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
    setSuccess(false);
  }

  // Submit invoice to PostgreSQL through FastAPI
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.invoiceNumber.trim()) {
      setMessage("Please enter an invoice number.");
      setSuccess(false);
      return;
    }

    if (!form.vendorId) {
      setMessage("Please select a vendor.");
      setSuccess(false);
      return;
    }

    if (!form.invoiceDate) {
      setMessage("Please select an invoice date.");
      setSuccess(false);
      return;
    }

    if (form.dueDate && form.dueDate < form.invoiceDate) {
      setMessage("Due date cannot be earlier than invoice date.");
      setSuccess(false);
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setMessage("Invoice amount must be greater than zero.");
      setSuccess(false);
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const payload = {
        invoice_number: form.invoiceNumber.trim(),
        vendor_id: Number(form.vendorId),

        // Temporary test user ID until authentication is integrated
        uploaded_by: 1,

        invoice_date: form.invoiceDate,
        due_date: form.dueDate || null,
        total_amount: Number(form.amount),
        currency: "INR",
        status: "PENDING",
        description: form.description.trim() || null,
      };

      const response = await fetch(`${API_BASE_URL}/invoices/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.detail || "Failed to create invoice."
        );
      }

      const createdInvoice = await response.json();

      setSuccess(true);
      setMessage(
        `Invoice ${createdInvoice.invoice_number} created successfully!`
      );

      setForm({
        invoiceNumber: "",
        vendorId: "",
        invoiceDate: "",
        dueDate: "",
        amount: "",
        description: "",
      });

      // Redirect to Invoice Management after successful creation
      setTimeout(() => {
        router.push("/invoices");
      }, 1200);

    } catch (error) {
      setSuccess(false);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the invoice."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-slate-100 md:p-10">
      <div className="mx-auto max-w-3xl">

        {/* Navigation */}
        <Link
          href="/"
          className="text-sm text-blue-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        {/* Page Header */}
        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold">
            Add New Invoice
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Enter invoice information for validation and duplicate detection.
          </p>
        </div>

        {/* Invoice Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >

          {/* Invoice Number */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">
              Invoice Information
            </h2>

            <label className="mb-2 block text-sm text-slate-300">
              Invoice Number *
            </label>

            <input
              type="text"
              required
              value={form.invoiceNumber}
              onChange={(e) =>
                updateField("invoiceNumber", e.target.value)
              }
              placeholder="Example: INV-1007"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Vendor Selection */}
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Vendor *
            </label>

            <select
              required
              value={form.vendorId}
              onChange={(e) =>
                updateField("vendorId", e.target.value)
              }
              disabled={loadingVendors || vendors.length === 0}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">
                {loadingVendors
                  ? "Loading vendors..."
                  : vendors.length === 0
                    ? "No active vendors available"
                    : "Select a vendor"}
              </option>

              {vendors.map((vendor) => (
                <option
                  key={vendor.vendor_id}
                  value={vendor.vendor_id}
                >
                  {vendor.vendor_name}
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Dates */}
          <div className="grid gap-5 sm:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Invoice Date *
              </label>

              <input
                type="date"
                required
                value={form.invoiceDate}
                onChange={(e) =>
                  updateField("invoiceDate", e.target.value)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Due Date
              </label>

              <input
                type="date"
                min={form.invoiceDate || undefined}
                value={form.dueDate}
                onChange={(e) =>
                  updateField("dueDate", e.target.value)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

          </div>

          {/* Amount */}
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Invoice Amount (₹) *
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) =>
                updateField("amount", e.target.value)
              }
              placeholder="Enter invoice amount"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Description
            </label>

            <textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                updateField("description", e.target.value)
              }
              placeholder="Enter invoice description"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Success / Error Message */}
          {message && (
            <div
              className={`rounded-lg border p-4 text-sm ${
                success
                  ? "border-green-800 bg-green-950/40 text-green-400"
                  : "border-red-800 bg-red-950/40 text-red-400"
              }`}
            >
              {message}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap gap-3">

            <button
              type="submit"
              disabled={
                submitting ||
                loadingVendors ||
                vendors.length === 0
              }
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Creating Invoice..."
                : "Create Invoice"}
            </button>

            <Link
              href="/invoices"
              className="rounded-lg border border-slate-700 px-6 py-3 text-sm hover:bg-slate-800"
            >
              Cancel
            </Link>

          </div>

        </form>
      </div>
    </main>
  );
}
