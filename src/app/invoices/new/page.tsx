
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
  "w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-blue-500";

const labelClass =
  "mb-2 block text-sm text-slate-300";

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
    <main className="min-h-screen bg-slate-950 p-5 text-slate-100 md:p-10">
      <div className="mx-auto max-w-4xl">

        {/* Navigation */}
        <Link
          href="/"
          className="text-sm text-blue-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold">
            Add New Invoice
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Enter invoice information and add individual
            items for automatic calculation.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >

          {/* Invoice Information */}
          <section>
            <h2 className="mb-5 text-lg font-semibold">
              Invoice Information
            </h2>

            <div className="space-y-5">

              <div>
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

              <div>
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

              <div className="grid gap-5 sm:grid-cols-2">

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

              </div>

              <div>
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

          <div className="border-t border-slate-800" />

          {/* Invoice Items */}
          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

              <div>
                <h2 className="text-lg font-semibold">
                  Invoice Items
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Add products or services included in this invoice.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                disabled={items.length >= 100}
                className="rounded-lg border border-blue-500 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-500/10 disabled:opacity-50"
              >
                + Add Item
              </button>

            </div>

            <div className="space-y-5">

              {calculations.calculatedItems.map(
                (item, index) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-700 bg-slate-950 p-4 sm:p-5"
                  >

                    <div className="mb-4 flex items-center justify-between">

                      <h3 className="font-semibold">
                        Item {index + 1}
                      </h3>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="text-sm text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Remove
                      </button>

                    </div>

                    <div className="space-y-4">

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
                      <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">

                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">
                            Line Total
                          </span>

                          <span>
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </div>

                        <div className="mt-2 flex justify-between text-sm">
                          <span className="text-slate-400">
                            Tax Amount
                          </span>

                          <span>
                            {formatCurrency(item.taxAmount)}
                          </span>
                        </div>

                        <div className="mt-3 flex justify-between border-t border-slate-700 pt-3 font-semibold">
                          <span>Item Total</span>

                          <span className="text-blue-400">
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
          <section className="rounded-xl border border-slate-700 bg-slate-950 p-5">

            <h2 className="mb-5 text-lg font-semibold">
              Invoice Summary
            </h2>

            <div className="space-y-3">

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  Subtotal
                </span>

                <span>
                  {formatCurrency(calculations.subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  Total Tax
                </span>

                <span>
                  {formatCurrency(calculations.totalTax)}
                </span>
              </div>

              <div className="border-t border-slate-700 pt-4">

                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-semibold">
                    Grand Total
                  </span>

                  <span className="text-2xl font-bold text-green-400">
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
