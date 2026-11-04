
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import API_BASE_URL from "@/lib/api";
import { apiFetch } from "@/lib/api";

type Vendor = {
  vendor_id: number;
  vendor_name: string;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  address: string | null;
  is_active: boolean;
};

type Invoice = {
  invoice_id: number;
  vendor_id: number;
  total_amount: number | string;
  currency?: string | null;
};

type VendorForm = {
  vendor_name: string;
  email: string;
  phone: string;
  tax_id: string;
  address: string;
};

const initialForm: VendorForm = {
  vendor_name: "",
  email: "",
  phone: "",
  tax_id: "",
  address: "",
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<VendorForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editForm, setEditForm] = useState<VendorForm>(initialForm);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState("");

  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [vendorResponse, invoiceResponse] = await Promise.all([
        apiFetch(`${API_BASE_URL}/vendors/`),
        apiFetch(`${API_BASE_URL}/invoices/`),
      ]);

      if (!vendorResponse.ok) {
        throw new Error("Failed to fetch vendors.");
      }

      const vendorData: Vendor[] = await vendorResponse.json();
      setVendors(vendorData);

      if (invoiceResponse.ok) {
        const invoiceData: Invoice[] = await invoiceResponse.json();
        setInvoices(invoiceData);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading vendors."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEditFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // CREATE VENDOR
  const handleAddVendor = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const response = await apiFetch(`${API_BASE_URL}/vendors/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendor_name: form.vendor_name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          tax_id: form.tax_id.trim() || null,
          address: form.address.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail
            ? typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail)
            : "Failed to create vendor."
        );
      }

      setForm(initialForm);
      setShowAddForm(false);
      setSuccessMessage("Vendor created successfully!");

      await fetchVendors();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the vendor."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // OPEN EDIT FORM
  const openEditForm = (vendor: Vendor) => {
    setEditingVendor(vendor);

    setEditForm({
      vendor_name: vendor.vendor_name,
      email: vendor.email ?? "",
      phone: vendor.phone ?? "",
      tax_id: vendor.tax_id ?? "",
      address: vendor.address ?? "",
    });

    setEditError("");
    setSuccessMessage("");
  };

  // UPDATE VENDOR
  const handleUpdateVendor = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!editingVendor) return;

    setUpdating(true);
    setEditError("");
    setSuccessMessage("");

    try {
      const response = await apiFetch(
        `${API_BASE_URL}/vendors/${editingVendor.vendor_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vendor_name: editForm.vendor_name.trim(),
            email: editForm.email.trim() || null,
            phone: editForm.phone.trim() || null,
            tax_id: editForm.tax_id.trim() || null,
            address: editForm.address.trim() || null,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Vendor not found or is inactive.");
        }

        if (response.status === 409) {
          throw new Error("This Tax ID is already used by another vendor.");
        }

        throw new Error(
          data?.detail
            ? typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail)
            : "Failed to update vendor."
        );
      }

      setEditingVendor(null);
      setSuccessMessage("Vendor updated successfully!");

      await fetchVendors();
    } catch (err) {
      setEditError(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating the vendor."
      );
    } finally {
      setUpdating(false);
    }
  };

  // SOFT DELETE VENDOR
  const handleDeleteVendor = async () => {
    if (!deletingVendor) return;

    setDeleting(true);
    setDeleteError("");
    setSuccessMessage("");

    try {
      const response = await apiFetch(
        `${API_BASE_URL}/vendors/${deletingVendor.vendor_id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Vendor not found or is already inactive.");
        }

        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail
            ? typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail)
            : "Failed to delete vendor."
        );
      }

      // DELETE returns 204 No Content, so do not parse a JSON body.
      setDeletingVendor(null);
      setSuccessMessage(
        `${deletingVendor.vendor_name} was successfully deactivated.`
      );

      await fetchVendors();
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Something went wrong while deleting the vendor."
      );
    } finally {
      setDeleting(false);
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
      (vendor.email ?? "").toLowerCase().includes(search.toLowerCase());

    const status = vendor.is_active ? "Active" : "Inactive";
    const matchesFilter = filter === "All" || status === filter;

    return matchesSearch && matchesFilter;
  });

  const totalVendors = vendors.length;

  const activeVendors = vendors.filter(
    (vendor) => vendor.is_active
  ).length;

  const inactiveVendors = totalVendors - activeVendors;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  const totalInvoiceValue = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total_amount || 0),
    0
  );

  const getVendorInvoiceStats = (vendorId: number) => {
    const vendorInvoices = invoices.filter(
      (invoice) => invoice.vendor_id === vendorId
    );

    const amount = vendorInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total_amount || 0),
      0
    );

    return {
      count: vendorInvoices.length,
      amount,
    };
  };

  return (
    <main className="min-h-screen bg-[#eaf0f8] px-4 py-7 text-[#14243b] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#315b8a] transition hover:text-blue-700"
        >
          <span className="text-lg">←</span>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-7 mt-6 overflow-hidden rounded-2xl bg-[#14243b] p-6 text-white shadow-md sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                INVOICEGUARD MANAGEMENT
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Vendor Management
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/75">
                Manage vendor information, monitor activity and track invoice
                relationships.
              </p>
            </div>

            <button
              onClick={() => {
                setForm(initialForm);
                setFormError("");
                setSuccessMessage("");
                setShowAddForm(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <span className="text-lg">+</span>
              Add Vendor
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
              ✓
            </span>
            {successMessage}
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Vendors"
            value={loading ? "..." : totalVendors.toString()}
            subtitle="All registered vendors"
            icon="◈"
            color="blue"
          />

          <SummaryCard
            title="Active Vendors"
            value={loading ? "..." : activeVendors.toString()}
            subtitle="Currently active"
            icon="✓"
            color="green"
          />

          <SummaryCard
            title="Inactive Vendors"
            value={loading ? "..." : inactiveVendors.toString()}
            subtitle="Deactivated vendors"
            icon="−"
            color="red"
          />

          <SummaryCard
            title="Total Invoice Value"
            value={loading ? "..." : formatCurrency(totalInvoiceValue)}
            subtitle="Across all loaded invoices"
            icon="₹"
            color="amber"
          />
        </div>

        {/* Vendor Table */}
        <section className="overflow-hidden rounded-2xl border border-[#dce5f1] bg-white shadow-sm">

          {/* Table Header */}
          <div className="border-b border-[#e7edf5] bg-[#f2f6fc] px-5 py-5 sm:px-7">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold text-[#14243b]">
                  All Vendors
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  View and manage your registered vendor records.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    ⌕
                  </span>
                  <input
                    type="text"
                    placeholder="Search vendor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-[#d7e1ee] bg-white py-2.5 pl-9 pr-4 text-sm text-[#14243b] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-60"
                  />
                </div>

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="rounded-xl border border-[#d7e1ee] bg-white px-4 py-2.5 text-sm text-[#14243b] outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="All">All Vendors</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">

            {loading && (
              <div className="py-14 text-center">
                <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                <p className="font-semibold text-[#31506f]">
                  Loading vendors...
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Retrieving vendor information from the database.
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
                <p className="text-sm font-medium text-red-700">{error}</p>
                <button
                  onClick={fetchVendors}
                  className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#e7edf5] text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-4 font-semibold">Vendor Name</th>
                        <th className="px-4 py-4 font-semibold">Contact</th>
                        <th className="px-4 py-4 font-semibold">Tax ID</th>
                        <th className="px-4 py-4 font-semibold">Invoices</th>
                        <th className="px-4 py-4 font-semibold">Total Amount</th>
                        <th className="px-4 py-4 font-semibold">Status</th>
                        <th className="px-4 py-4 font-semibold">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredVendors.map((vendor) => (
                        <tr
                          key={vendor.vendor_id}
                          className="border-b border-[#edf1f7] transition last:border-0 hover:bg-[#f8faff]"
                        >
                          <td className="px-4 py-5">
                            <p className="font-semibold text-[#14243b]">
                              {vendor.vendor_name}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              ID: {vendor.vendor_id}
                            </p>
                          </td>

                          <td className="px-4 py-5">
                            <p className="text-[#31506f]">
                              {vendor.email || "-"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {vendor.phone || "-"}
                            </p>
                          </td>

                          <td className="px-4 py-5 text-[#31506f]">
                            {vendor.tax_id || "-"}
                          </td>

                          <td className="px-4 py-5">
                            <span className="inline-flex rounded-lg bg-[#edf3fb] px-3 py-1.5 font-semibold text-[#315b8a]">
                              {getVendorInvoiceStats(vendor.vendor_id).count}
                            </span>
                          </td>

                          <td className="px-4 py-5 font-semibold text-[#14243b]">
                            {formatCurrency(
                              getVendorInvoiceStats(vendor.vendor_id).amount
                            )}
                          </td>

                          <td className="px-4 py-5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                vendor.is_active
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  vendor.is_active
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              />
                              {vendor.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="px-4 py-5">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditForm(vendor)}
                                disabled={!vendor.is_active}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Edit
                              </button>

                              {vendor.is_active && (
                                <button
                                  onClick={() => {
                                    setDeletingVendor(vendor);
                                    setDeleteError("");
                                    setSuccessMessage("");
                                  }}
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredVendors.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-14 text-center"
                          >
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf3fb] text-xl text-[#315b8a]">
                              ◈
                            </div>
                            <p className="font-semibold text-[#31506f]">
                              No vendors found.
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Try changing your search or filter.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf1f7] pt-4">
                  <p className="text-xs text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-[#31506f]">
                      {filteredVendors.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-[#31506f]">
                      {totalVendors}
                    </span>{" "}
                    vendors
                  </p>
                  <p className="text-xs text-slate-400">
                    InvoiceGuard Vendor Management
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Add Vendor Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14243b]/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#dce5f1] bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-[#e7edf5] bg-[#f2f6fc] px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-[#14243b]">
                    Add New Vendor
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Enter the vendor's contact information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-slate-500 transition hover:bg-white hover:text-[#14243b]"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddVendor} className="space-y-4 p-6">
                <VendorFields
                  form={form}
                  onChange={handleFormChange}
                />

                {formError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-[#e7edf5] pt-5">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    disabled={submitting}
                    className="rounded-xl border border-[#d7e1ee] px-5 py-2.5 text-sm font-semibold text-[#31506f] transition hover:bg-[#f2f6fc] disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save Vendor"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Vendor Modal */}
        {editingVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14243b]/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#dce5f1] bg-white shadow-2xl">

              <div className="flex items-center justify-between border-b border-[#e7edf5] bg-[#f2f6fc] px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-[#14243b]">
                    Edit Vendor
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Vendor ID: {editingVendor.vendor_id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  disabled={updating}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl text-slate-500 transition hover:bg-white hover:text-[#14243b]"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleUpdateVendor} className="space-y-4 p-6">
                <VendorFields
                  form={editForm}
                  onChange={handleEditFormChange}
                />

                {editError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {editError}
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-[#e7edf5] pt-5">
                  <button
                    type="button"
                    onClick={() => setEditingVendor(null)}
                    disabled={updating}
                    className="rounded-xl border border-[#d7e1ee] px-5 py-2.5 text-sm font-semibold text-[#31506f] transition hover:bg-[#f2f6fc] disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={updating}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updating ? "Updating..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14243b]/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#dce5f1] bg-white shadow-2xl">

              <div className="border-b border-red-100 bg-red-50 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-xl font-bold text-red-600">
                    !
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#14243b]">
                      Deactivate Vendor?
                    </h2>
                    <p className="mt-1 text-xs text-red-600">
                      Please confirm this action.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-sm leading-6 text-slate-600">
                  Are you sure you want to deactivate{" "}
                  <span className="font-semibold text-[#14243b]">
                    {deletingVendor.vendor_name}
                  </span>
                  ? The vendor record will remain in the database, but its
                  status will change to Inactive.
                </p>

                {deleteError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {deleteError}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeletingVendor(null)}
                    disabled={deleting}
                    className="rounded-xl border border-[#d7e1ee] px-5 py-2.5 text-sm font-semibold text-[#31506f] transition hover:bg-[#f2f6fc] disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteVendor}
                    disabled={deleting}
                    className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleting ? "Deactivating..." : "Yes, Deactivate"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

function VendorFields({
  form,
  onChange,
}: {
  form: VendorForm;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}) {
  return (
    <>
      <FormField
        label="Vendor Name *"
        name="vendor_name"
        value={form.vendor_name}
        onChange={onChange}
        placeholder="Enter vendor name"
        required
      />

      <FormField
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={onChange}
        placeholder="Enter email address"
      />

      <FormField
        label="Phone"
        name="phone"
        value={form.phone}
        onChange={onChange}
        placeholder="Enter phone number"
      />

      <FormField
        label="Tax ID / GST Number"
        name="tax_id"
        value={form.tax_id}
        onChange={onChange}
        placeholder="Enter GST number"
      />

      <div>
        <label className="mb-2 block text-sm font-semibold text-[#263b56]">
          Address
        </label>

        <textarea
          name="address"
          value={form.address}
          onChange={onChange}
          placeholder="Enter vendor address"
          rows={3}
          className="w-full resize-y rounded-xl border border-[#d7e1ee] bg-[#f8faff] px-4 py-3 text-sm text-[#14243b] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </div>
    </>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#263b56]">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-[#d7e1ee] bg-[#f8faff] px-4 py-3 text-sm text-[#14243b] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: "blue" | "green" | "red" | "amber";
}) {
  const colorStyles = {
    blue: {
      icon: "bg-blue-100 text-blue-700",
      value: "text-blue-700",
      accent: "bg-blue-500",
    },
    green: {
      icon: "bg-green-100 text-green-700",
      value: "text-green-700",
      accent: "bg-green-500",
    },
    red: {
      icon: "bg-red-100 text-red-700",
      value: "text-red-700",
      accent: "bg-red-500",
    },
    amber: {
      icon: "bg-amber-100 text-amber-700",
      value: "text-amber-700",
      accent: "bg-amber-500",
    },
  };

  const styles = colorStyles[color];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#dce5f1] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h2 className={`mt-3 break-words text-2xl font-bold ${styles.value}`}>
            {value}
          </h2>
          <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${styles.icon}`}>
          {icon}
        </div>
      </div>

      <div className={`absolute bottom-0 left-0 h-1 w-full ${styles.accent}`} />
    </div>
  );
}
