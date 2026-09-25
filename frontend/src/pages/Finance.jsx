import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  XCircle,
} from "lucide-react";

import api from "../api";

function getResults(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStudentName(student, students) {
  if (!student) {
    return "Unknown student";
  }

  if (typeof student === "object") {
    return (
      `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
      student.admission_number ||
      "Unknown student"
    );
  }

  const found = students.find(
    (item) => String(item.id) === String(student)
  );

  if (!found) {
    return `Student #${student}`;
  }

  return (
    `${found.first_name || ""} ${found.last_name || ""}`.trim() ||
    found.admission_number ||
    `Student #${student}`
  );
}

function getStudentAdmission(student, students) {
  if (!student) {
    return "—";
  }

  if (typeof student === "object") {
    return student.admission_number || "—";
  }

  const found = students.find(
    (item) => String(item.id) === String(student)
  );

  return found?.admission_number || "—";
}

function getPaymentStatus(payment) {
  return String(payment?.status || "PENDING").toUpperCase();
}

function StatusBadge({ status }) {
  const styles = {
    CONFIRMED:
      "bg-emerald-50 text-emerald-700 border border-emerald-200",
    PENDING:
      "bg-amber-50 text-amber-700 border border-amber-200",
    FAILED:
      "bg-red-50 text-red-700 border border-red-200",
  };

  const icons = {
    CONFIRMED: CheckCircle2,
    PENDING: Clock3,
    FAILED: XCircle,
  };

  const Icon = icons[status] || AlertCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] ||
        "bg-slate-50 text-slate-600 border border-slate-200"
      }`}
    >
      <Icon size={13} />
      {status}
    </span>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function Finance() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadFinance = async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [paymentsResponse, studentsResponse, ledgerResponse] =
        await Promise.all([
          api.get("/fee-payments/?page_size=100"),
          api.get("/students/?page_size=100"),
          api.get("/fee-ledger/?page_size=100"),
        ]);

      setPayments(getResults(paymentsResponse.data));
      setStudents(getResults(studentsResponse.data));
      setLedgerEntries(getResults(ledgerResponse.data));
    } catch (err) {
      console.error("Failed to load finance data:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load finance data. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFinance();
  }, []);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const status = getPaymentStatus(payment);

      if (statusFilter !== "ALL" && status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const studentName = getStudentName(payment.student, students);
      const admissionNumber = getStudentAdmission(
        payment.student,
        students
      );

      const searchableText = [
        studentName,
        admissionNumber,
        payment.transaction_id,
        payment.mpesa_receipt_number,
        payment.phone_number,
        payment.checkout_request_id,
        payment.merchant_request_id,
        status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [payments, students, search, statusFilter]);

  const summary = useMemo(() => {
    const confirmed = payments.filter(
      (payment) => getPaymentStatus(payment) === "CONFIRMED"
    );

    const pending = payments.filter(
      (payment) => getPaymentStatus(payment) === "PENDING"
    );

    const failed = payments.filter(
      (payment) => getPaymentStatus(payment) === "FAILED"
    );

    const totalCollected = confirmed.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );

    const pendingAmount = pending.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );

    const failedAmount = failed.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );

    return {
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      totalCollected,
      pendingAmount,
      failedAmount,
    };
  }, [payments]);

  const recentLedger = useMemo(() => {
    return [...ledgerEntries]
      .sort((a, b) => {
        const first = new Date(
          a.created_at || a.entry_date || 0
        ).getTime();

        const second = new Date(
          b.created_at || b.entry_date || 0
        ).getTime();

        return second - first;
      })
      .slice(0, 8);
  }, [ledgerEntries]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="animate-spin" size={22} />
          <span>Loading finance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Finance
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            School Finance
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor fee collections, M-Pesa payments and the school ledger.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadFinance(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-semibold">Finance data could not be loaded</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Collected"
          value={formatCurrency(summary.totalCollected)}
          subtitle={`${summary.confirmedCount} confirmed payments`}
          icon={TrendingUp}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          title="Pending"
          value={formatCurrency(summary.pendingAmount)}
          subtitle={`${summary.pendingCount} pending payments`}
          icon={Clock3}
          iconClass="bg-amber-50 text-amber-600"
        />

        <StatCard
          title="Failed"
          value={formatCurrency(summary.failedAmount)}
          subtitle={`${summary.failedCount} failed payments`}
          icon={XCircle}
          iconClass="bg-red-50 text-red-600"
        />

        <StatCard
          title="Transactions"
          value={payments.length}
          subtitle={`${ledgerEntries.length} ledger entries`}
          icon={CreditCard}
          iconClass="bg-blue-50 text-blue-600"
        />
      </div>

      {/* Payments */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Fee Payments
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                M-Pesa and fee payment transactions for your school.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student or transaction..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 sm:w-72"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="ALL">All statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <CreditCard size={25} />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No payments found
            </h3>

            <p className="mt-1 max-w-md text-sm text-slate-500">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Student
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    M-Pesa Receipt
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => {
                  const status = getPaymentStatus(payment);

                  return (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {getStudentName(
                              payment.student,
                              students
                            )}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {getStudentAdmission(
                              payment.student,
                              students
                            )}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(payment.amount)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-sm text-slate-700">
                          {payment.mpesa_receipt_number ||
                            payment.transaction_id ||
                            "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {payment.phone_number || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={status} />
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(
                          payment.paid_at || payment.created_at
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-200 px-5 py-3">
          <p className="text-xs text-slate-500">
            Showing {filteredPayments.length} of {payments.length} payments
          </p>
        </div>
      </section>

      {/* Ledger */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-900">
            Recent Ledger Activity
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recent financial entries recorded against student accounts.
          </p>
        </div>

        {recentLedger.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            No ledger entries available.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLedger.map((entry) => {
              const student = entry.student;

              return (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {getStudentName(student, students)}
                      </p>

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600">
                        {entry.entry_type || "ENTRY"}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {entry.description ||
                        entry.reference ||
                        "Financial ledger entry"}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(entry.amount)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(
                        entry.created_at || entry.entry_date
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}