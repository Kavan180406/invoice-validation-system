
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import API_BASE_URL, { apiFetch } from "@/lib/api";

type Vendor = {
  vendor_id: number;
  vendor_name: string;
  is_active: boolean;
};

type InvoiceItem = {
  id: number;
  item_description: string;
  quantity: string;
  unit_price: string;
  tax_rate: string;
};

type InvoiceForm = {
  invoiceNumber: string;
  vendorId: string;
  invoiceDate: string;
  dueDate: string;
  description: string;
};

const createEmptyItem = (): InvoiceItem => ({
  id: Date.now() + Math.random(),
  item_description: "",
  quantity: "1",
  unit_price: "",
  tax_rate: "0",
});

const inputClass =
  "w-full rounded-xl border border-[#d6e0ed] bg-[#edf3fb] px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function AddInvoicePage() {
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<InvoiceForm>({
    invoiceNumber: "",
    vendorId: "",
    invoiceDate: "",
    dueDate: "",
    description: "",
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    createEmptyItem(),
  ]);

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch active vendors
  useEffect(() => {
    async function fetchVendors() {
      try {
        setLoadingVendors(true);

        const response = await apiFetch(
          `${API_BASE_URL}/vendors/`
        );

        if (!response.ok) {
          throw new Error("Unable to load vendors.");
        }

        const data: Vendor[] = await response.json();

        setVendors(
          data.filter((vendor) => vendor.is_active)
        );
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

  // Update invoice information
  function updateField(
    field: keyof InvoiceForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
    setSuccess(false);
  }

  // Add invoice item
  function addItem() {
    setItems((previous) => [
      ...previous,
      createEmptyItem(),
    ]);

    setMessage("");
    setSuccess(false);
  }

  // Remove invoice item
  function removeItem(id: number) {
    setItems((previous) =>
      previous.filter((item) => item.id !== id)
    );

    setMessage("");
    setSuccess(false);
  }

  // Update an invoice item
  function updateItem(
    id: number,
    field: keyof Omit<InvoiceItem, "id">,
    value: string
  ) {
    setItems((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, [field]: value }
          : item
      )
    );

    setMessage("");
    setSuccess(false);
  }

  // Calculate subtotal, tax and total
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    const calculatedItems = items.map((item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const taxRate = Number(item.tax_rate) || 0;

      const lineTotal = quantity * unitPrice;
      const taxAmount = lineTotal * (taxRate / 100);

      subtotal += lineTotal;
      totalTax += taxAmount;

      return {
        ...item,
        lineTotal,
        taxAmount,
        totalWithTax: lineTotal + taxAmount,
      };
    });

    subtotal = Number(subtotal.toFixed(2));
    totalTax = Number(totalTax.toFixed(2));

    return {
      calculatedItems,
      subtotal,
      totalTax,
      grandTotal: Number(
        (subtotal + totalTax).toFixed(2)
      ),
    };
  }, [items]);

  // Validate invoice items
  function validateItems(): boolean {
    if (items.length === 0) {
      setMessage("Please add at least one invoice item.");
      return false;
    }

    for (let index = 0; index < items.length; index++) {
      const item = items[index];

      if (!item.item_description.trim()) {
        setMessage(
          `Please enter a description for item ${index + 1}.`
        );
        return false;
      }

      if (
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        setMessage(
          `Enter a valid quantity for item ${index + 1}.`
        );
        return false;
      }

      if (
        !Number.isFinite(Number(item.unit_price)) ||
        Number(item.unit_price) < 0
      ) {
        setMessage(
          `Enter a valid unit price for item ${index + 1}.`
        );
        return false;
      }

      if (
        !Number.isFinite(Number(item.tax_rate)) ||
        Number(item.tax_rate) < 0 ||
        Number(item.tax_rate) > 100
      ) {
        setMessage(
          `Tax rate for item ${index + 1} must be between 0 and 100.`
        );
        return false;
      }
    }

    if (calculations.grandTotal <= 0) {
      setMessage("Invoice total must be greater than zero.");
      return false;
    }

    return true;
  }

  // Submit invoice
  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!form.invoiceNumber.trim()) {
      setMessage("Please enter an invoice number.");
      return;
    }

    if (!form.vendorId) {
      setMessage("Please select a vendor.");
      return;
    }

    if (!form.invoiceDate) {
      setMessage("Please select an invoice date.");
      return;
    }

    if (
      form.dueDate &&
      form.dueDate < form.invoiceDate
    ) {
      setMessage(
        "Due date cannot be earlier than invoice date."
      );
      return;
    }

    if (!validateItems()) {
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      setSuccess(false);

      const payload = {
        invoice_number: form.invoiceNumber.trim(),
        vendor_id: Number(form.vendorId),

        invoice_date: form.invoiceDate,
        due_date: form.dueDate || null,

        total_amount: calculations.grandTotal,

        currency: "INR",
        status: "PENDING",

        description:
          form.description.trim() || null,

        items: items.map((item) => ({
          item_description: item.item_description.trim(),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          tax_rate: Number(item.tax_rate),
        })),
      };

      const response = await apiFetch(
        `${API_BASE_URL}/invoices/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        const detail = errorData?.detail;

        throw new Error(
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail
                  .map((error: { msg?: string }) => error.msg)
                  .filter(Boolean)
                  .join(", ")
              : "Failed to create invoice."
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
        description: "",
      });

      setItems([createEmptyItem()]);

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
    <main className="min-h-screen bg-[#eaf0f8] text-slate-800">

      {/* Navy Header */}
      <header className="border-b border-slate-700 bg-[#14243b] px-5 py-6 text-white md:px-9">
        <div className="mx-auto max-w-5xl">

          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-blue-300 transition hover:text-white"
          >
            ← Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-xl font-bold shadow-lg shadow-blue-950/30">
              +
            </div>

            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-blue-300">
                Invoice Management
              </p>

              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Add New Invoice
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Enter invoice information and add individual items for automatic calculation.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 md:px-9">

        <form
          onSubmit={handleSubmit}
          className="space-y-7"
        >

          {/* Invoice Information */}
          <section className="overflow-hidden rounded-2xl border border-[#d4deec] bg-[#f8faff] shadow-sm shadow-slate-300/40">

            <div className="border-b border-[#dce5f0] bg-[#f2f6fc] px-5 py-5 md:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg text-blue-700">
                  ▤
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#172b46]">
                    Invoice Information
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Enter the basic details of your invoice.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 md:p-7">

              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Invoice Number *
                </label>

                <input
                  type="text"
                  required
                  maxLength={50}
                  value={form.invoiceNumber}
                  onChange={(e) =>
                    updateField("invoiceNumber", e.target.value)
                  }
                  placeholder="Example: INV-1007"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Vendor *
                </label>

                <select
                  required
                  value={form.vendorId}
                  onChange={(e) =>
                    updateField("vendorId", e.target.value)
                  }
                  disabled={
                    loadingVendors ||
                    vendors.length === 0
                  }
                  className={inputClass}
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

              <div>
                <label className={labelClass}>
                  Invoice Date *
                </label>

                <input
                  type="date"
                  required
                  value={form.invoiceDate}
                  onChange={(e) =>
                    updateField("invoiceDate", e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Due Date
                </label>

                <input
                  type="date"
                  min={form.invoiceDate || undefined}
                  value={form.dueDate}
                  onChange={(e) =>
                    updateField("dueDate", e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Description
                </label>

                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    updateField("description", e.target.value)
                  }
                  placeholder="Enter invoice description"
                  className={inputClass}
                />
              </div>

            </div>
          </section>

          {/* Invoice Items */}
          <section className="overflow-hidden rounded-2xl border border-[#d4deec] bg-[#f8faff] shadow-sm shadow-slate-300/40">

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce5f0] bg-[#f2f6fc] px-5 py-5 md:px-7">

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg text-blue-700">
                  ◫
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#172b46]">
                    Invoice Items
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Add products or services included in this invoice.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={addItem}
                disabled={items.length >= 100}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Add Item
              </button>

            </div>

            <div className="space-y-5 p-5 md:p-7">

              {calculations.calculatedItems.map(
                (item, index) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-[#d6e0ed] bg-[#edf3fb]"
                  >

                    <div className="flex items-center justify-between border-b border-[#d6e0ed] bg-[#e4edfa] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                          {index + 1}
                        </span>

                        <h3 className="text-sm font-bold text-[#173b6b]">
                          Item {index + 1}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-4 p-4 md:p-5">

                      {/* Item Description */}
                      <div>
                        <label className={labelClass}>
                          Item Description *
                        </label>

                        <input
                          type="text"
                          required
                          maxLength={255}
                          value={item.item_description}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "item_description",
                              e.target.value
                            )
                          }
                          placeholder="Example: Laptop"
                          className={inputClass}
                        />
                      </div>

                      {/* Quantity and Price */}
                      <div className="grid gap-4 sm:grid-cols-2">

                        <div>
                          <label className={labelClass}>
                            Quantity *
                          </label>

                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "quantity",
                                e.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>
                            Unit Price (₹) *
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={item.unit_price}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "unit_price",
                                e.target.value
                              )
                            }
                            placeholder="Enter unit price"
                            className={inputClass}
                          />
                        </div>

                      </div>

                      {/* Tax */}
                      <div>
                        <label className={labelClass}>
                          Tax Rate (%)
                        </label>

                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.tax_rate}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "tax_rate",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      {/* Item Calculation */}
                      <div className="rounded-xl border border-[#d6e0ed] bg-[#f8faff] p-4">

                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Item Calculation
                        </p>

                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">
                            Line Total
                          </span>

                          <span className="font-medium text-slate-800">
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </div>

                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-slate-500">
                            Tax Amount
                          </span>

                          <span className="font-medium text-slate-800">
                            {formatCurrency(item.taxAmount)}
                          </span>
                        </div>

                        <div className="mt-3 flex justify-between border-t border-[#dce5f0] pt-3 font-bold">
                          <span className="text-slate-700">
                            Item Total
                          </span>

                          <span className="text-blue-700">
                            {formatCurrency(item.totalWithTax)}
                          </span>
                        </div>

                      </div>

                    </div>
                  </div>
                )
              )}

            </div>
          </section>

          {/* Invoice Summary */}
          <section className="overflow-hidden rounded-2xl border border-blue-200 bg-[#e4edfa] shadow-sm">

            <div className="border-b border-blue-200 px-5 py-5 md:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg font-bold text-blue-700">
                  ₹
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#173b6b]">
                    Invoice Summary
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Automatically calculated from invoice items.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5 md:p-7">

              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-600">
                  Subtotal
                </span>

                <span className="font-semibold text-slate-800">
                  {formatCurrency(calculations.subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-600">
                  Total Tax
                </span>

                <span className="font-semibold text-slate-800">
                  {formatCurrency(calculations.totalTax)}
                </span>
              </div>

              <div className="border-t border-blue-200 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">

                  <div>
                    <p className="text-base font-bold text-[#173b6b]">
                      Grand Total
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Including applicable taxes
                    </p>
                  </div>

                  <span className="text-2xl font-bold text-green-700 md:text-3xl">
                    {formatCurrency(calculations.grandTotal)}
                  </span>

                </div>
              </div>

            </div>
          </section>

          {/* Success / Error Message */}
          {message && (
            <div
              role="alert"
              className={`flex items-start gap-3 rounded-xl border p-4 text-sm font-medium ${
                success
                  ? "border-green-200 bg-[#e7f3ed] text-green-800"
                  : "border-red-200 bg-[#fff0ef] text-red-800"
              }`}
            >
              <span className="text-lg">
                {success ? "✓" : "!"}
              </span>

              <span>{message}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-[#d4deec] bg-[#f8faff] p-5 shadow-sm">

            <Link
              href="/invoices"
              className="rounded-xl border border-[#d6e0ed] bg-[#edf3fb] px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#e2ebf7]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                submitting ||
                loadingVendors ||
                vendors.length === 0
              }
              className="rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-md shadow-blue-900/15 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Creating Invoice..."
                : "Create Invoice"}
            </button>

          </div>

        </form>

        <footer className="mt-8 pb-3 text-center text-xs text-slate-500">
          InvoiceGuard © 2026 | Invoice Validation & Duplicate Detection System
        </footer>

      </div>
    </main>
  );
}
