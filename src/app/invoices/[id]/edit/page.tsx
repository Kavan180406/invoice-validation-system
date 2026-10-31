
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const sampleInvoices: Record<string, {
  invoiceNumber: string;
  vendor: string;
  invoiceDate: string;
  dueDate: string;
  amount: string;
  description: string;
}> = {
  "INV-1001": {
    invoiceNumber: "INV-1001",
    vendor: "ABC Technologies",
    invoiceDate: "2026-10-31",
    dueDate: "2026-11-30",
    amount: "45000",
    description: "Technology equipment purchase",
  },
  "INV-1002": {
    invoiceNumber: "INV-1002",
    vendor: "Global Supplies",
    invoiceDate: "2026-10-30",
    dueDate: "2026-11-30",
    amount: "12500",
    description: "Office supplies purchase",
  },
  "INV-1003": {
    invoiceNumber: "INV-1003",
    vendor: "ABC Technologies",
    invoiceDate: "2026-10-29",
    dueDate: "2026-11-29",
    amount: "45000",
    description: "Technology equipment purchase",
  },
  "INV-1004": {
    invoiceNumber: "INV-1004",
    vendor: "Metro Solutions",
    invoiceDate: "2026-10-28",
    dueDate: "2026-11-28",
    amount: "28000",
    description: "Software services",
  },
  "INV-1005": {
    invoiceNumber: "INV-1005",
    vendor: "Digital World",
    invoiceDate: "2026-10-27",
    dueDate: "2026-11-27",
    amount: "67500",
    description: "Digital equipment purchase",
  },
  "INV-1006": {
    invoiceNumber: "INV-1006",
    vendor: "Smart Systems",
    invoiceDate: "2026-10-26",
    dueDate: "2026-11-26",
    amount: "18000",
    description: "Computer accessories",
  },
};

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = params.id;

  const [form, setForm] = useState({
    invoiceNumber: "",
    vendor: "",
    invoiceDate: "",
    dueDate: "",
    amount: "",
    description: "",
  });

  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const invoice = sampleInvoices[id];

    if (invoice) {
      setForm(invoice);
    }

    setLoaded(true);
  }, [id]);

  function updateField(field: string, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!sampleInvoices[id]) {
      setMessage("Invoice not found.");
      return;
    }

    if (form.dueDate < form.invoiceDate) {
      setMessage("Due date cannot be earlier than invoice date.");
      return;
    }

    if (Number(form.amount) <= 0) {
      setMessage("Invoice amount must be greater than zero.");
      return;
    }

    setMessage(
      "Invoice changes validated successfully! Database integration is coming next."
    );
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        Loading invoice...
      </main>
    );
  }

  if (!sampleInvoices[id]) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <h1 className="text-2xl font-bold">Invoice not found</h1>
        <Link href="/invoices" className="mt-4 inline-block text-blue-400">
          Back to Invoices
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-slate-100 md:p-10">

      <div className="mx-auto max-w-3xl">

        <Link
          href={`/invoices/${id}`}
          className="text-sm text-blue-400 hover:underline"
        >
          ← Back to Invoice Details
        </Link>

        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold">
            Edit Invoice
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Update invoice information and validate changes.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >

          <h2 className="text-lg font-semibold">
            Invoice Information
          </h2>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Invoice Number
            </label>

            <input
              required
              value={form.invoiceNumber}
              onChange={(e) =>
                updateField("invoiceNumber", e.target.value)
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Vendor Name
            </label>

            <input
              required
              value={form.vendor}
              onChange={(e) =>
                updateField("vendor", e.target.value)
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Invoice Date
              </label>

              <input
                type="date"
                required
                value={form.invoiceDate}
                onChange={(e) =>
                  updateField("invoiceDate", e.target.value)
                }
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
                min={form.invoiceDate || undefined}
                value={form.dueDate}
                onChange={(e) =>
                  updateField("dueDate", e.target.value)
                }
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
              value={form.amount}
              onChange={(e) =>
                updateField("amount", e.target.value)
              }
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
              onChange={(e) =>
                updateField("description", e.target.value)
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 outline-none focus:border-blue-500"
            />
          </div>

          {message && (
            <div className="rounded-lg border border-blue-800 bg-blue-950/40 p-4 text-sm text-blue-300">
              {message}
            </div>
          )}

          <div className="flex flex-wrap gap-3">

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500"
            >
              Save Changes
            </button>

            <button
              type="button"
              onClick={() => router.push(`/invoices/${id}`)}
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
