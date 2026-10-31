
"use client";

import { useState } from "react";
import Link from "next/link";

export default function AddInvoicePage() {
  const [form, setForm] = useState({
    invoiceNumber: "",
    vendor: "",
    invoiceDate: "",
    dueDate: "",
    amount: "",
    description: "",
  });

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function updateField(field: string, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
    setSuccess(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (form.dueDate < form.invoiceDate) {
      setMessage("Due date cannot be earlier than invoice date.");
      setSuccess(false);
      return;
    }

    if (Number(form.amount) <= 0) {
      setMessage("Invoice amount must be greater than zero.");
      setSuccess(false);
      return;
    }

    setMessage(
      "Invoice details validated successfully! Database integration is coming next."
    );

    setSuccess(true);
  }

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-slate-100 md:p-10">
      <div className="mx-auto max-w-3xl">

        {/* Back to Dashboard */}
        <Link
          href="/"
          className="text-sm text-blue-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        {/* Page Heading */}
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

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Vendor Name *
            </label>

            <input
              type="text"
              required
              value={form.vendor}
              onChange={(e) =>
                updateField("vendor", e.target.value)
              }
              placeholder="Enter vendor name"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

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
                Due Date *
              </label>

              <input
                type="date"
                required
                min={form.invoiceDate || undefined}
                value={form.dueDate}
                onChange={(e) =>
                  updateField("dueDate", e.target.value)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

          </div>

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
              placeholder="Enter invoice description or item details"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Validation Message */}
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
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500"
            >
              Validate Invoice
            </button>

            <Link
              href="/"
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
