"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import API_BASE_URL, { apiFetch } from "@/lib/api";

type Invoice = {
  invoice_id: number;
  invoice_number: string;
  vendor_id: number;
  uploaded_by: number | null;
  invoice_date: string;
  due_date: string | null;
  total_amount: number | string;
  currency: string;
  status: string;
  description: string | null;
};

type Vendor = {
  vendor_id: number;
  vendor_name: string;
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  DUPLICATE: "Duplicate",
  REJECTED: "Rejected",
  FLAGGED: "Flagged",
};

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError("");

        const [invoiceResponse, vendorResponse] = await Promise.all([
          apiFetch(`${API_BASE_URL}/invoices/`),
          apiFetch(`${API_BASE_URL}/vendors/`),
        ]);

        if (!invoiceResponse.ok) {
          throw new Error("Unable to load invoices.");
        }

        if (!vendorResponse.ok) {
          throw new Error("Unable to load vendors.");
        }

        const invoiceData: Invoice[] = await invoiceResponse.json();
        const vendorData: Vendor[] = await vendorResponse.json();

        setInvoices(invoiceData);
        setVendors(vendorData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const vendorMap = useMemo(() => {
    return new Map(
      vendors.map((vendor) => [vendor.vendor_id, vendor.vendor_name])
    );
  }, [vendors]);

  const getVendorName = (vendorId: number) => {
    return vendorMap.get(vendorId) || `Vendor #${vendorId}`;
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status.toUpperCase()] || status;
  };

  const verifiedCount = invoices.filter(
    (invoice) => invoice.status.toUpperCase() === "VERIFIED"
  ).length;

  const duplicateCount = invoices.filter(
    (invoice) => invoice.status.toUpperCase() === "DUPLICATE"
  ).length;

  const pendingCount = invoices.filter(
    (invoice) => invoice.status.toUpperCase() === "PENDING"
  ).length;

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const vendorName = getVendorName(invoice.vendor_id);
      const searchTerm = search.trim().toLowerCase();

      const matchesSearch =
        invoice.invoice_number.toLowerCase().includes(searchTerm) ||
        vendorName.toLowerCase().includes(searchTerm);

      const matchesFilter =
        filter === "All" || getStatusLabel(invoice.status) === filter;

      return matchesSearch && matchesFilter;
    });
  }, [invoices, vendors, search, filter]);

  const recentInvoices = filteredInvoices.slice(0, 6);

  const duplicateInvoices = invoices.filter(
    (invoice) => invoice.status.toUpperCase() === "DUPLICATE"
  );

  const formatDate = (date: string) => {
    if (!date) return "—";

    const parts = date.split("-");

    if (parts.length !== 3) return date;

    return new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number | string, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount));
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:flex">
      {/* Sidebar */}
      <aside className="w-full border-b border-slate-800 bg-slate-900 p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">
            Invoice<span className="text-blue-400">Guard</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Invoice Validation System
          </p>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Main Menu
        </p>

        <nav className="space-y-2">
          <Link
            href="/"
            className="block rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white"
          >
            ▦ Dashboard
          </Link>

          <Link
            href="/invoices"
            className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            ▤ Invoices
          </Link>

          <Link
            href="/duplicates"
            className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            ◈ Duplicate Detection
          </Link>

          <Link
            href="/vendors"
            className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            ♙ Vendors
          </Link>

          <Link
            href="/audit-logs"
            className="block rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            ◷ Audit Logs
          </Link>
        </nav>

        <div className="mt-10 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm font-semibold">InvoiceGuard</p>
          <p className="mt-1 text-xs text-slate-400">
            Protecting financial records through intelligent validation.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main id="dashboard" className="min-w-0 flex-1 p-5 md:p-8">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-400">
              Monitor invoices and identify suspicious transactions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2">
              <p className="text-sm font-semibold">Administrator</p>
              <p className="text-xs text-slate-400">Admin Account</p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Loading and Error */}
        {loading && (
          <div className="mb-6 rounded-lg border border-blue-900 bg-blue-950/20 p-4 text-sm text-blue-400">
            Loading dashboard data from database...
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-900 bg-red-950/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Statistics */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Invoices"
            value={loading ? "..." : invoices.length.toString()}
            subtitle="Active database invoices"
            symbol="▤"
          />

          <StatCard
            title="Verified Invoices"
            value={loading ? "..." : verifiedCount.toString()}
            subtitle="Successfully verified"
            symbol="✓"
          />

          <StatCard
            title="Duplicate Invoices"
            value={loading ? "..." : duplicateCount.toString()}
            subtitle="Requires attention"
            symbol="◈"
          />

          <StatCard
            title="Pending Review"
            value={loading ? "..." : pendingCount.toString()}
            subtitle="Awaiting verification"
            symbol="◷"
          />
        </section>

        {/* Recent Invoice Table */}
        <section
          id="invoices"
          className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Recent Invoices</h3>
              <p className="text-sm text-slate-400">
                Review and monitor submitted invoices.
              </p>
            </div>

            <Link
              href="/invoices/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
            >
              + Add Invoice
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Search invoice number or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none focus:border-blue-500"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none"
            >
              <option value="All">All</option>
              <option value="Verified">Verified</option>
              <option value="Duplicate">Duplicate</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
              <option value="Flagged">Flagged</option>
            </select>
          </div>

          {/* Invoice Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-4">Invoice ID</th>
                  <th className="px-3 py-4">Vendor</th>
                  <th className="px-3 py-4">Date</th>
                  <th className="px-3 py-4">Amount</th>
                  <th className="px-3 py-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {!loading &&
                  !error &&
                  recentInvoices.map((invoice) => (
                    <tr
                      key={invoice.invoice_id}
                      className="border-b border-slate-800 hover:bg-slate-800/50"
                    >
                      <td className="px-3 py-4 font-medium text-blue-400">
                        <Link
                          href={`/invoices/${invoice.invoice_id}`}
                          className="hover:underline"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </td>

                      <td className="px-3 py-4">
                        {getVendorName(invoice.vendor_id)}
                      </td>

                      <td className="px-3 py-4 text-slate-400">
                        {formatDate(invoice.invoice_date)}
                      </td>

                      <td className="px-3 py-4">
                        {formatAmount(
                          invoice.total_amount,
                          invoice.currency
                        )}
                      </td>

                      <td className="px-3 py-4">
                        <StatusBadge
                          status={getStatusLabel(invoice.status)}
                        />
                      </td>
                    </tr>
                  ))}

                {!loading && !error && recentInvoices.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-slate-400"
                    >
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Showing {loading ? "..." : recentInvoices.length} of{" "}
            {loading ? "..." : filteredInvoices.length} matching invoices
          </p>

          <div className="mt-5">
            <Link
              href="/invoices"
              className="text-sm text-blue-400 hover:underline"
            >
              View All Invoices →
            </Link>
          </div>
        </section>

        {/* Duplicate Alerts */}
        <section
          id="duplicates"
          className="rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold">
              Duplicate Detection Alerts
            </h3>
            <p className="text-sm text-slate-400">
              Potentially suspicious invoice records.
            </p>
          </div>

          <div className="space-y-3">
            {!loading && !error && duplicateInvoices.length === 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
                <p className="text-sm text-slate-300">
                  No duplicate invoices currently flagged.
                </p>
              </div>
            )}

            {!loading &&
              !error &&
              duplicateInvoices.map((invoice) => (
                <div
                  key={invoice.invoice_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-900/50 bg-red-950/20 p-4"
                >
                  <div>
                    <Link
                      href={`/invoices/${invoice.invoice_id}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {invoice.invoice_number}
                    </Link>

                    <p className="mt-1 text-xs text-slate-400">
                      Vendor: {getVendorName(invoice.vendor_id)}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Amount:{" "}
                      {formatAmount(
                        invoice.total_amount,
                        invoice.currency
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-red-400">Duplicate</p>
                    <p className="text-xs text-slate-500">
                      Requires review
                    </p>
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-5">
            <Link
              href="/duplicates"
              className="text-sm text-blue-400 hover:underline"
            >
              View All Duplicate Records →
            </Link>
          </div>
        </section>

        <footer className="mt-8 text-center text-xs text-slate-500">
          InvoiceGuard © 2026 | Invoice Validation & Duplicate Detection
          System
        </footer>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  symbol,
}: {
  title: string;
  value: string;
  subtitle: string;
  symbol: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <span className="text-xl text-blue-400">{symbol}</span>
      </div>

      <h3 className="text-3xl font-bold">{value}</h3>

      <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Verified: "bg-green-500/10 text-green-400",
    Duplicate: "bg-red-500/10 text-red-400",
    Pending: "bg-yellow-500/10 text-yellow-400",
    Rejected: "bg-red-500/10 text-red-400",
    Flagged: "bg-orange-500/10 text-orange-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || "bg-slate-700 text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}