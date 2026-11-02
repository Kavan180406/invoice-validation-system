
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import API_BASE_URL from "@/lib/api";
import { apiFetch } from "@/lib/api";

type Invoice = {
  invoice_id: number;
  invoice_number: string;
  vendor_id: number;
  invoice_date: string;
  total_amount: number | string;
  currency: string;
};

type Vendor = {
  vendor_id: number;
  vendor_name: string;
};

type DuplicateRecord = {
  duplicate_check_id: number;
  invoice_id: number;
  matched_invoice_id: number;
  similarity_score: number;
  detection_reason: string | null;
  review_status: string;
};

type DisplayRecord = DuplicateRecord & {
  invoice_number: string;
  matched_invoice_number: string;
  vendor_name: string;
  invoice_date: string;
  amount: number;
  currency: string;
};

function formatDate(date: string) {
  if (!date) return "â€”";

  const parts = date.split("-");
  if (parts.length !== 3) return date;

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function DuplicatesPage() {
  const [records, setRecords] = useState<DisplayRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const fetchDuplicateData = useCallback(async () => {
    try {
      setLoading(true);

      const [duplicatesResponse, invoicesResponse, vendorsResponse] =
        await Promise.all([
          apiFetch(`${API_BASE_URL}/duplicates/`),
          apiFetch(`${API_BASE_URL}/invoices/`),
          apiFetch(`${API_BASE_URL}/vendors/`),
        ]);

      if (!duplicatesResponse.ok) {
        throw new Error("Unable to load duplicate records.");
      }

      if (!invoicesResponse.ok) {
        throw new Error("Unable to load invoices.");
      }

      if (!vendorsResponse.ok) {
        throw new Error("Unable to load vendors.");
      }

      const duplicates: DuplicateRecord[] =
        await duplicatesResponse.json();

      const invoiceData: Invoice[] =
        await invoicesResponse.json();

      const vendors: Vendor[] =
        await vendorsResponse.json();

      setInvoices(invoiceData);

      const mappedRecords: DisplayRecord[] = duplicates
        .map((record) => {
          const invoice = invoiceData.find(
            (item) => item.invoice_id === record.invoice_id
          );

          const matchedInvoice = invoiceData.find(
            (item) => item.invoice_id === record.matched_invoice_id
          );

          const vendor = invoice
            ? vendors.find(
                (item) => item.vendor_id === invoice.vendor_id
              )
            : undefined;

          if (!invoice || !matchedInvoice) return null;

          return {
            ...record,
            invoice_number: invoice.invoice_number,
            matched_invoice_number: matchedInvoice.invoice_number,
            vendor_name: vendor?.vendor_name ?? "Unknown Vendor",
            invoice_date: invoice.invoice_date,
            amount: Number(invoice.total_amount),
            currency: invoice.currency,
          };
        })
        .filter((record): record is DisplayRecord => record !== null);

      setRecords(mappedRecords);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load duplicate records."
      );
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDuplicateData();
  }, [fetchDuplicateData]);

  async function handleDetection() {
    if (!selectedInvoice) {
      setMessage("Please select an invoice first.");
      setSuccess(false);
      return;
    }

    try {
      setDetecting(true);
      setMessage("");

      const response = await apiFetch(
        `${API_BASE_URL}/duplicates/${selectedInvoice}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Duplicate detection failed."
        );
      }

      const results: DuplicateRecord[] = await response.json();

      setSuccess(true);

      setMessage(
        results.length > 0
          ? `${results.length} potential duplicate match(es) detected successfully.`
          : "Detection completed. No duplicate matches found."
      );

      await fetchDuplicateData();
    } catch (error) {
      setSuccess(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Duplicate detection failed."
      );
    } finally {
      setDetecting(false);
    }
  }

  const filteredRecords = records.filter((record) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      record.invoice_number.toLowerCase().includes(searchValue) ||
      record.matched_invoice_number.toLowerCase().includes(searchValue) ||
      record.vendor_name.toLowerCase().includes(searchValue);

    const matchesFilter =
      filter === "All" || record.review_status === filter;

    return matchesSearch && matchesFilter;
  });

  const confirmedCount = records.filter(
    (record) => record.review_status === "CONFIRMED"
  ).length;

  const reviewCount = records.filter(
    (record) => record.review_status === "UNDER_REVIEW"
  ).length;

  const totalAmount = records.reduce(
    (sum, record) => sum + record.amount,
    0
  );

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-slate-100 md:p-10">
      <div className="mx-auto max-w-7xl">

        <Link
          href="/"
          className="text-sm text-blue-400 hover:underline"
        >
          â† Back to Dashboard
        </Link>

        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold">
            Duplicate Detection
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Identify and review potentially duplicated invoices.
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Flagged"
            value={records.length.toString()}
            color="text-blue-400"
          />

          <SummaryCard
            title="Confirmed Duplicates"
            value={confirmedCount.toString()}
            color="text-red-400"
          />

          <SummaryCard
            title="Under Review"
            value={reviewCount.toString()}
            color="text-yellow-400"
          />

          <SummaryCard
            title="Flagged Amount"
            value={"â‚¹" + totalAmount.toLocaleString("en-IN")}
            color="text-purple-400"
          />
        </div>

        <section className="mb-8 rounded-xl border border-blue-900 bg-blue-950/20 p-5">
          <h2 className="font-semibold text-blue-400">
            Duplicate Detection Overview
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Invoices are compared using vendor information,
            invoice numbers and invoice amounts. Matches with
            a similarity score of 60% or higher are flagged
            for review before payment approval.
          </p>
        </section>

        <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">
            Run Duplicate Detection
          </h2>

          <div className="flex flex-wrap gap-3">
            <select
              value={selectedInvoice}
              onChange={(e) => setSelectedInvoice(e.target.value)}
              disabled={loading || invoices.length === 0}
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Select an invoice</option>

              {invoices.map((invoice) => (
                <option
                  key={invoice.invoice_id}
                  value={invoice.invoice_id}
                >
                  {invoice.invoice_number}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleDetection}
              disabled={detecting || loading || invoices.length === 0}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {detecting ? "Detecting..." : "Detect Duplicates"}
            </button>
          </div>

          {message && (
            <p
              className={`mt-4 rounded-lg border p-3 text-sm ${
                success
                  ? "border-green-800 bg-green-950/30 text-green-400"
                  : "border-red-800 bg-red-950/30 text-red-400"
              }`}
            >
              {message}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              Flagged Invoices
            </h2>

            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search invoice or vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none focus:border-blue-500 sm:w-64"
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-400">
              Loading duplicate records...
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-4 py-4">Invoice</th>
                    <th className="px-4 py-4">Vendor</th>
                    <th className="px-4 py-4">Matched Invoice</th>
                    <th className="px-4 py-4">Match Reason</th>
                    <th className="px-4 py-4">Confidence</th>
                    <th className="px-4 py-4">Amount</th>
                    <th className="px-4 py-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.duplicate_check_id}
                      className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-5 font-semibold text-blue-400">
                        {record.invoice_number}
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(record.invoice_date)}
                        </p>
                      </td>

                      <td className="px-4 py-5">
                        {record.vendor_name}
                      </td>

                      <td className="px-4 py-5 text-blue-400">
                        {record.matched_invoice_number}
                      </td>

                      <td className="px-4 py-5 text-slate-300">
                        {record.detection_reason || "Not specified"}
                      </td>

                      <td className="px-4 py-5">
                        <span className="font-semibold text-yellow-400">
                          {Number(record.similarity_score)}%
                        </span>
                      </td>

                      <td className="px-4 py-5 font-medium">
                        {record.currency}{" "}
                        {record.amount.toLocaleString("en-IN")}
                      </td>

                      <td className="px-4 py-5">
                        <span
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                            record.review_status === "CONFIRMED"
                              ? "bg-red-500/10 text-red-400"
                              : record.review_status === "DISMISSED"
                                ? "bg-slate-500/10 text-slate-400"
                                : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {record.review_status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-slate-400"
                      >
                        {records.length === 0
                          ? "No duplicate records found. Run duplicate detection to get started."
                          : "No matching records found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-5 text-sm text-slate-500">
            Showing {filteredRecords.length} of {records.length} flagged records
          </p>
        </section>
      </div>
    </main>
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
      <p className="text-sm text-slate-400">{title}</p>

      <h2 className={`mt-3 text-2xl font-bold ${color}`}>
        {value}
      </h2>
    </div>
  );
}

