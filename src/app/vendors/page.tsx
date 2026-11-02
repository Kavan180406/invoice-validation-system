
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

      const response = await apiFetch(`${API_BASE_URL}/vendors/`);

      if (!response.ok) {
        throw new Error("Failed to fetch vendors.");
      }

      const data: Vendor[] = await response.json();
      setVendors(data);
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

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-slate-100 md:p-10">
      <div className="mx-auto max-w-7xl">

        <Link
          href="/"
          className="text-sm text-blue-400 hover:underline"
        >
          â† Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8 mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Vendor Management
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage vendor information and track invoice activity.
            </p>
          </div>

          <button
            onClick={() => {
              setForm(initialForm);
              setFormError("");
              setSuccessMessage("");
              setShowAddForm(true);
            }}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
          >
            + Add Vendor
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400">
            {successMessage}
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            title="Total Vendors"
            value={loading ? "..." : totalVendors.toString()}
            color="text-blue-400"
          />

          <SummaryCard
            title="Active Vendors"
            value={loading ? "..." : activeVendors.toString()}
            color="text-green-400"
          />

          <SummaryCard
            title="Inactive Vendors"
            value={loading ? "..." : inactiveVendors.toString()}
            color="text-red-400"
          />

          <SummaryCard
            title="Total Invoice Value"
            value="Not available"
            color="text-yellow-400"
          />

        </div>

        {/* Vendor Table */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

            <h2 className="text-xl font-semibold">
              All Vendors
            </h2>

            <div className="flex flex-wrap gap-3">

              <input
                type="text"
                placeholder="Search vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none focus:border-blue-500"
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none"
              >
                <option value="All">All Vendors</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

            </div>
          </div>

          {loading && (
            <p className="py-10 text-center text-blue-400">
              Loading vendors from database...
            </p>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-red-400">
              {error}
              <button
                onClick={fetchVendors}
                className="ml-3 underline"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead className="border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="px-4 py-4">Vendor Name</th>
                      <th className="px-4 py-4">Contact</th>
                      <th className="px-4 py-4">Tax ID</th>
                      <th className="px-4 py-4">Invoices</th>
                      <th className="px-4 py-4">Total Amount</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredVendors.map((vendor) => (
                      <tr
                        key={vendor.vendor_id}
                        className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40"
                      >

                        <td className="px-4 py-5">
                          <p className="font-semibold">
                            {vendor.vendor_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            ID: {vendor.vendor_id}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          <p>{vendor.email || "â€”"}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {vendor.phone || "â€”"}
                          </p>
                        </td>

                        <td className="px-4 py-5">
                          {vendor.tax_id || "â€”"}
                        </td>

                        <td className="px-4 py-5 text-slate-400">
                          â€”
                        </td>

                        <td className="px-4 py-5 text-slate-400">
                          â€”
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              vendor.is_active
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {vendor.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditForm(vendor)}
                              disabled={!vendor.is_active}
                              className="rounded-lg border border-blue-500/40 px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-40"
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
                                className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10"
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
                          className="px-4 py-10 text-center text-slate-400"
                        >
                          No vendors found.
                        </td>
                      </tr>
                    )}

                  </tbody>

                </table>

              </div>

              <p className="mt-5 text-sm text-slate-500">
                Showing {filteredVendors.length} of {totalVendors} vendors
              </p>
            </>
          )}

        </section>

        {/* Add Vendor Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  Add New Vendor
                </h2>

                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-2xl text-slate-400 hover:text-white"
                >
                  Ã—
                </button>
              </div>

              <form onSubmit={handleAddVendor} className="space-y-4">
                <VendorFields
                  form={form}
                  onChange={handleFormChange}
                />

                {formError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    disabled={submitting}
                    className="rounded-lg border border-slate-700 px-5 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    Edit Vendor
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Vendor ID: {editingVendor.vendor_id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  disabled={updating}
                  className="text-2xl text-slate-400 hover:text-white"
                >
                  Ã—
                </button>
              </div>

              <form onSubmit={handleUpdateVendor} className="space-y-4">
                <VendorFields
                  form={editForm}
                  onChange={handleEditFormChange}
                />

                {editError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {editError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingVendor(null)}
                    disabled={updating}
                    className="rounded-lg border border-slate-700 px-5 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={updating}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

              <h2 className="text-xl font-bold">
                Deactivate Vendor?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Are you sure you want to deactivate{" "}
                <span className="font-semibold text-white">
                  {deletingVendor.vendor_name}
                </span>
                ? The vendor record will remain in the database, but its
                status will change to Inactive.
              </p>

              {deleteError && (
                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {deleteError}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingVendor(null)}
                  disabled={deleting}
                  className="rounded-lg border border-slate-700 px-5 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteVendor}
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? "Deactivating..." : "Yes, Deactivate"}
                </button>
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
        <label className="mb-2 block text-sm text-slate-300">
          Address
        </label>

        <textarea
          name="address"
          value={form.address}
          onChange={onChange}
          placeholder="Enter vendor address"
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
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
      <label className="mb-2 block text-sm text-slate-300">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <h2 className={`mt-3 text-2xl font-bold ${color}`}>
        {value}
      </h2>
    </div>
  );
}

