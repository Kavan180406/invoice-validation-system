
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

type CurrentUser = {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
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

  // Logged-in user information
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Load the logged-in user's information
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as CurrentUser;
        setCurrentUser(parsedUser);
      } catch {
        localStorage.removeItem("user");
        setCurrentUser(null);
      }
    }
  }, []);

  // Fetch dashboard data
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

  const isAdmin = currentUser?.role?.toUpperCase() === "ADMIN";

  const roleLabel =
    currentUser?.role?.toUpperCase() === "ADMIN"
      ? "Administrator"
      : currentUser?.role?.toUpperCase() === "STAFF"
        ? "Staff"
        : "User";

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

    const datePart = date.split("T")[0];
    const parts = datePart.split("-");

    if (parts.length !== 3) return date;

    const [year, month, day] = parts;

    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
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
    <div className="min-h-screen bg-[#eaf0f8] text-slate-800 md:flex">

      {/* Sidebar */}
      <aside className="flex w-full flex-col border-b border-slate-700 bg-[#14243b] px-5 py-6 text-white md:min-h-screen md:w-64 md:border-b-0 md:border-r md:border-slate-700">

        {/* Brand */}
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-lg font-bold text-white shadow-lg shadow-blue-950/40">
            I
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Invoice<span className="text-blue-400">Guard</span>
            </h1>
            <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400">
              INVOICE VALIDATION SYSTEM
            </p>
          </div>
        </div>

        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Workspace
        </p>

        {/* Navigation */}
        <nav className="space-y-1.5">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl border border-blue-400/20 bg-blue-500/15 px-4 py-3 text-sm font-semibold text-blue-300 shadow-sm"
          >
            <span className="text-lg">▦</span>
            Dashboard
          </Link>

          <Link
            href="/invoices"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-700/60 hover:text-white"
          >
            <span className="text-lg">▤</span>
            Invoices
          </Link>

          <Link
            href="/duplicates"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-700/60 hover:text-white"
          >
            <span className="text-lg">◈</span>
            Duplicate Detection
          </Link>

          <Link
            href="/vendors"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-700/60 hover:text-white"
          >
            <span className="text-lg">♙</span>
            Vendors
          </Link>

          {/* Audit Logs are visible only to Admin */}
          {isAdmin && (
            <Link
              href="/audit-logs"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-700/60 hover:text-white"
            >
              <span className="text-lg">◷</span>
              Audit Logs
            </Link>
          )}
        </nav>

        {/* Sidebar Information */}
        <div className="mt-10 rounded-2xl border border-slate-600/60 bg-[#1c304d] p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-lg text-blue-300">
            ✦
          </div>

          <p className="text-sm font-bold text-white">InvoiceGuard</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Protecting financial records through intelligent validation.
          </p>
        </div>

        <div className="mt-auto hidden border-t border-slate-700 pt-5 md:block">
          <p className="text-xs text-slate-400">
            InvoiceGuard © 2026
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Secure invoice management
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main
        id="dashboard"
        className="min-w-0 flex-1 px-5 py-7 md:px-9 md:py-9"
      >

        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
              Overview
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-[#172b46] md:text-3xl">
              Dashboard
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Monitor invoices and identify suspicious transactions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* Dynamic logged-in user information */}
            <div className="flex items-center gap-3 rounded-xl border border-[#d5dfed] bg-[#f8faff] px-4 py-2.5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
                {(currentUser?.full_name || currentUser?.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-800">
                  {currentUser ? roleLabel : "Loading account..."}
                </p>

                <p className="max-w-[150px] truncate text-xs text-slate-500">
                  {currentUser?.full_name || currentUser?.email || "Please wait"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-red-200 bg-[#fff7f7] px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Loading and Error */}
        {loading && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-[#dce9fa] p-4 text-sm text-blue-800">
            <span className="mr-2 inline-block animate-pulse">●</span>
            Loading dashboard data from database...
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
            accent="blue"
          />

          <StatCard
            title="Verified Invoices"
            value={loading ? "..." : verifiedCount.toString()}
            subtitle="Successfully verified"
            symbol="✓"
            accent="green"
          />

          <StatCard
            title="Duplicate Invoices"
            value={loading ? "..." : duplicateCount.toString()}
            subtitle="Requires attention"
            symbol="◈"
            accent="red"
          />

          <StatCard
            title="Pending Review"
            value={loading ? "..." : pendingCount.toString()}
            subtitle="Awaiting verification"
            symbol="◷"
            accent="amber"
          />
        </section>

        {/* Recent Invoice Table */}
        <section
          id="invoices"
          className="mb-8 overflow-hidden rounded-2xl border border-[#d4deec] bg-[#f8faff] shadow-sm shadow-slate-300/40"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce5f0] bg-[#f2f6fc] px-5 py-5 md:px-6">
            <div>
              <h3 className="text-lg font-bold text-[#172b46]">
                Recent Invoices
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Review and monitor submitted invoices.
              </p>
            </div>

            <Link
              href="/invoices/new"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-900/15 transition hover:bg-blue-700"
            >
              + Add Invoice
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row md:px-6">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search invoice number or vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#d6e0ed] bg-[#edf3fb] py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-[#d6e0ed] bg-[#edf3fb] px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All Statuses</option>
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
              <thead className="border-y border-[#dce5f0] bg-[#e9f0f9] text-[11px] uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-bold">Invoice ID</th>
                  <th className="px-6 py-4 font-bold">Vendor</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Amount</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#e2e9f2]">
                {!loading &&
                  !error &&
                  recentInvoices.map((invoice) => (
                    <tr
                      key={invoice.invoice_id}
                      className="transition hover:bg-[#edf4fd]"
                    >
                      <td className="px-6 py-4 font-semibold text-blue-700">
                        <Link
                          href={`/invoices/${invoice.invoice_id}`}
                          className="hover:underline"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {getVendorName(invoice.vendor_id)}
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(invoice.invoice_date)}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {formatAmount(
                          invoice.total_amount,
                          invoice.currency
                        )}
                      </td>

                      <td className="px-6 py-4">
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
                      className="py-12 text-center text-sm text-slate-400"
                    >
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dce5f0] bg-[#f2f6fc] px-5 py-4 md:px-6">
            <p className="text-xs text-slate-500">
              Showing {loading ? "..." : recentInvoices.length} of{" "}
              {loading ? "..." : filteredInvoices.length} matching invoices
            </p>

            <Link
              href="/invoices"
              className="text-sm font-bold text-blue-700 transition hover:text-blue-900"
            >
              View All Invoices →
            </Link>
          </div>
        </section>

        {/* Duplicate Alerts */}
        <section
          id="duplicates"
          className="overflow-hidden rounded-2xl border border-[#d4deec] bg-[#f8faff] shadow-sm shadow-slate-300/40"
        >
          <div className="border-b border-[#dce5f0] bg-[#f2f6fc] px-5 py-5 md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-lg text-red-600">
                ◈
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#172b46]">
                  Duplicate Detection Alerts
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Potentially suspicious invoice records.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-5 md:p-6">
            {!loading && !error && duplicateInvoices.length === 0 && (
              <div className="rounded-xl border border-green-200 bg-[#e8f5ee] p-5">
                <p className="text-sm font-semibold text-green-800">
                  ✓ No duplicate invoices currently flagged.
                </p>
              </div>
            )}

            {!loading &&
              !error &&
              duplicateInvoices.map((invoice) => (
                <div
                  key={invoice.invoice_id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-200 bg-[#fff4f3] p-4 transition hover:bg-red-50"
                >
                  <div>
                    <Link
                      href={`/invoices/${invoice.invoice_id}`}
                      className="text-sm font-bold text-slate-800 hover:text-blue-700 hover:underline"
                    >
                      {invoice.invoice_number}
                    </Link>

                    <p className="mt-1 text-xs text-slate-500">
                      Vendor: {getVendorName(invoice.vendor_id)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Amount:{" "}
                      {formatAmount(
                        invoice.total_amount,
                        invoice.currency
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                      Duplicate
                    </span>

                    <p className="mt-2 text-xs text-slate-500">
                      Requires review
                    </p>
                  </div>
                </div>
              ))}
          </div>

          <div className="border-t border-[#dce5f0] bg-[#f2f6fc] px-5 py-4 md:px-6">
            <Link
              href="/duplicates"
              className="text-sm font-bold text-blue-700 transition hover:text-blue-900"
            >
              View All Duplicate Records →
            </Link>
          </div>
        </section>

        <footer className="mt-8 pb-3 text-center text-xs text-slate-500">
          InvoiceGuard © 2026 | Invoice Validation & Duplicate Detection System
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
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  symbol: string;
  accent: "blue" | "green" | "red" | "amber";
}) {
  const accentStyles = {
    blue: {
      card: "bg-[#e4edfa] border-blue-200",
      icon: "bg-blue-100 text-blue-700",
      line: "bg-blue-600",
      value: "text-[#173b6b]",
    },
    green: {
      card: "bg-[#e7f3ed] border-green-200",
      icon: "bg-green-100 text-green-700",
      line: "bg-green-600",
      value: "text-[#155c3b]",
    },
    red: {
      card: "bg-[#f9e9e9] border-red-200",
      icon: "bg-red-100 text-red-700",
      line: "bg-red-600",
      value: "text-[#8b2929]",
    },
    amber: {
      card: "bg-[#f8f0df] border-amber-200",
      icon: "bg-amber-100 text-amber-700",
      line: "bg-amber-500",
      value: "text-[#80520b]",
    },
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${accentStyles[accent].card}`}
    >
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">{title}</p>

        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${accentStyles[accent].icon}`}
        >
          {symbol}
        </span>
      </div>

      <h3
        className={`text-3xl font-bold tracking-tight ${accentStyles[accent].value}`}
      >
        {value}
      </h3>

      <p className="mt-2 text-xs font-medium text-slate-500">{subtitle}</p>

      <div
        className={`absolute bottom-0 left-0 h-1 w-full ${accentStyles[accent].line}`}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Verified: "bg-green-100 text-green-800 ring-green-200",
    Duplicate: "bg-red-100 text-red-800 ring-red-200",
    Pending: "bg-amber-100 text-amber-800 ring-amber-200",
    Rejected: "bg-red-100 text-red-800 ring-red-200",
    Flagged: "bg-orange-100 text-orange-800 ring-orange-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[status] || "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {status}
    </span>
  );
}
