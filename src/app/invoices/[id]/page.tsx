
import Link from "next/link";
import { notFound } from "next/navigation";

const invoices = [
  {
    id: "INV-1001",
    vendor: "ABC Technologies",
    date: "31 October 2026",
    dueDate: "30 November 2026",
    amount: 45000,
    status: "Verified",
    description: "Technology equipment purchase",
  },
  {
    id: "INV-1002",
    vendor: "Global Supplies",
    date: "30 October 2026",
    dueDate: "30 November 2026",
    amount: 12500,
    status: "Duplicate",
    description: "Office supplies purchase",
  },
  {
    id: "INV-1003",
    vendor: "ABC Technologies",
    date: "29 October 2026",
    dueDate: "29 November 2026",
    amount: 45000,
    status: "Duplicate",
    description: "Technology equipment purchase",
  },
  {
    id: "INV-1004",
    vendor: "Metro Solutions",
    date: "28 October 2026",
    dueDate: "28 November 2026",
    amount: 28000,
    status: "Pending",
    description: "Software services",
  },
  {
    id: "INV-1005",
    vendor: "Digital World",
    date: "27 October 2026",
    dueDate: "27 November 2026",
    amount: 67500,
    status: "Verified",
    description: "Digital equipment purchase",
  },
  {
    id: "INV-1006",
    vendor: "Smart Systems",
    date: "26 October 2026",
    dueDate: "26 November 2026",
    amount: 18000,
    status: "Pending",
    description: "Computer accessories",
  },
];

export default async function InvoiceDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const invoice = invoices.find((item) => item.id === id);

  if (!invoice) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-slate-100 md:p-10">
      <div className="mx-auto max-w-4xl">

        <Link
          href="/invoices"
          className="text-sm text-blue-400 hover:underline"
        >
          ← Back to Invoices
        </Link>

        <div className="mb-8 mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Invoice Details
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Complete information about this invoice.
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              invoice.status === "Verified"
                ? "bg-green-500/10 text-green-400"
                : invoice.status === "Duplicate"
                ? "bg-red-500/10 text-red-400"
                : "bg-yellow-500/10 text-yellow-400"
            }`}
          >
            {invoice.status}
          </span>
        </div>

        {/* Invoice Information */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">

          <div className="mb-6 border-b border-slate-800 pb-5">
            <p className="text-sm text-slate-400">
              Invoice Number
            </p>

            <h2 className="mt-2 text-2xl font-bold text-blue-400">
              {invoice.id}
            </h2>
          </div>

          <h3 className="mb-5 text-lg font-semibold">
            General Information
          </h3>

          <div className="grid gap-6 sm:grid-cols-2">
            <Detail label="Vendor Name" value={invoice.vendor} />

            <Detail label="Invoice Date" value={invoice.date} />

            <Detail label="Due Date" value={invoice.dueDate} />

            <Detail
              label="Invoice Amount"
              value={"₹" + invoice.amount.toLocaleString("en-IN")}
            />

            <Detail label="Invoice Status" value={invoice.status} />

            <Detail label="Invoice ID" value={invoice.id} />
          </div>

          <div className="mt-8 border-t border-slate-800 pt-6">
            <h3 className="mb-3 text-lg font-semibold">
              Description
            </h3>

            <p className="text-sm leading-7 text-slate-400">
              {invoice.description}
            </p>
          </div>
        </section>

        {/* Duplicate Warning */}
        {invoice.status === "Duplicate" && (
          <section className="mt-6 rounded-xl border border-red-900 bg-red-950/20 p-5">
            <h3 className="font-semibold text-red-400">
              Duplicate Invoice Alert
            </h3>

            <p className="mt-2 text-sm text-slate-300">
              This invoice has been flagged for potential duplication.
              Please review the vendor, invoice amount and invoice date
              before approving payment.
            </p>
          </section>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">

          <Link
            href={`/invoices/${id}/edit`}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500"
          >
            Edit Invoice
          </Link>

          <Link
            href="/invoices"
            className="rounded-lg border border-slate-700 px-5 py-3 text-sm hover:bg-slate-800"
          >
            Back to Invoice Management
          </Link>

        </div>

      </div>
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-medium">
        {value}
      </p>
    </div>
  );
}
