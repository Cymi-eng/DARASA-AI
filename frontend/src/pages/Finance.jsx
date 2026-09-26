import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Loader2,
  Phone,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";

import api from "../api";

function getResults(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function getStudentName(student) {
  if (!student) {
    return "Unknown student";
  }

  if (typeof student === "object") {
    return (
      `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
      "Unknown student"
    );
  }

  return `Student #${student}`;
}

function getStudentById(studentId, students) {
  if (!studentId) {
    return null;
  }

  if (typeof studentId === "object") {
    return studentId;
  }

  return (
    students.find(
      (student) => String(student.id) === String(studentId)
    ) || null
  );
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
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

function getStatusClasses(status) {
  if (status === "CONFIRMED") {
    return "bg-[#EAF3EE] text-[#0B5D43]";
  }

  if (status === "PENDING") {
    return "bg-[#FFF7E4] text-[#9A7600]";
  }

  if (status === "FAILED") {
    return "bg-[#FFF0EE] text-[#B33A31]";
  }

  return "bg-[#F1F3EE] text-[#52645D]";
}

function extractErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (!data) {
    return fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  const messages = Object.entries(data).flatMap(([field, value]) => {
    if (Array.isArray(value)) {
      return value.map((message) => `${field}: ${message}`);
    }

    if (typeof value === "string") {
      return [`${field}: ${value}`];
    }

    return [];
  });

  return messages.length > 0 ? messages.join(" ") : fallback;
}

const EMPTY_PAYMENT_FORM = {
  student: "",
  amount: "",
  phone_number: "",
};

function Finance() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [paymentForm, setPaymentForm] = useState(
    EMPTY_PAYMENT_FORM
  );

  async function loadFinanceData() {
    setLoading(true);
    setError("");

    try {
      const [
        paymentsResponse,
        studentsResponse,
        ledgerResponse,
      ] = await Promise.all([
        api.get("/fee-payments/", {
          params: {
            page_size: 100,
          },
        }),
        api.get("/students/", {
          params: {
            page_size: 100,
          },
        }),
        api.get("/fee-ledger/", {
          params: {
            page_size: 100,
          },
        }),
      ]);

      setPayments(getResults(paymentsResponse.data));
      setStudents(getResults(studentsResponse.data));
      setLedgerEntries(getResults(ledgerResponse.data));
    } catch (requestError) {
      setError(
        extractErrorMessage(
          requestError,
          "Unable to load finance data."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinanceData();
  }, []);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const student = getStudentById(
        payment.student,
        students
      );

      const studentName = getStudentName(student);
      const admissionNumber =
        student?.admission_number || "";

      const matchesSearch =
        !query ||
        studentName.toLowerCase().includes(query) ||
        admissionNumber.toLowerCase().includes(query) ||
        String(
          payment.mpesa_receipt_number || ""
        )
          .toLowerCase()
          .includes(query) ||
        String(payment.transaction_id || "")
          .toLowerCase()
          .includes(query) ||
        String(payment.phone_number || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        !statusFilter ||
        payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, students, search, statusFilter]);

  const summary = useMemo(() => {
    const confirmed = payments.filter(
      (payment) => payment.status === "CONFIRMED"
    );

    const pending = payments.filter(
      (payment) => payment.status === "PENDING"
    );

    const failed = payments.filter(
      (payment) => payment.status === "FAILED"
    );

    const totalCollected = confirmed.reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );

    return {
      totalCollected,
      pendingCount: pending.length,
      failedCount: failed.length,
      transactionCount: payments.length,
    };
  }, [payments]);

  function updatePaymentField(field, value) {
    setPaymentForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openPaymentForm() {
    setPaymentForm(EMPTY_PAYMENT_FORM);
    setFormError("");
    setSuccessMessage("");
    setShowPaymentForm(true);
  }

  function closePaymentForm() {
    if (submitting) {
      return;
    }

    setShowPaymentForm(false);
    setPaymentForm(EMPTY_PAYMENT_FORM);
    setFormError("");
  }

  async function handlePaymentSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      if (!paymentForm.student) {
        throw new Error("Please select a student.");
      }

      if (!paymentForm.amount) {
        throw new Error("Please enter the payment amount.");
      }

      if (Number(paymentForm.amount) <= 0) {
        throw new Error(
          "Payment amount must be greater than zero."
        );
      }

      if (!paymentForm.phone_number.trim()) {
        throw new Error(
          "Please enter the M-Pesa phone number."
        );
      }

      const response = await api.post("/fee-payments/", {
        student: Number(paymentForm.student),
        amount: Number(paymentForm.amount),
        phone_number: paymentForm.phone_number.trim(),
      });

      const message =
        response.data?.message ||
        response.data?.detail ||
        "Payment request sent successfully.";

      setSuccessMessage(message);
      setShowPaymentForm(false);
      setPaymentForm(EMPTY_PAYMENT_FORM);

      await loadFinanceData();
    } catch (requestError) {
      setFormError(
        requestError instanceof Error &&
          !requestError.response
          ? requestError.message
          : extractErrorMessage(
              requestError,
              "Unable to initiate payment."
            )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B5D43]">
            Finance
          </p>

          <h1 className="mt-2 text-2xl font-bold text-[#17382E]">
            School Finance
          </h1>

          <p className="mt-1 text-sm text-[#7C8984]">
            Manage fee payments and financial activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadFinanceData}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#DDE1DB] bg-white px-4 text-sm font-semibold text-[#405650] transition hover:bg-[#F7F8F4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openPaymentForm}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#084A36]"
          >
            <Plus size={18} />
            Make Payment
          </button>
        </div>
      </div>

      {/* SUCCESS */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-[#CFE4D8] bg-[#F0F8F3] p-4 text-sm text-[#0B5D43]">
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0"
          />

          <p>{successMessage}</p>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[#F0D2CE] bg-[#FFF5F3] p-4 text-sm text-[#B33A31]">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <p>{error}</p>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
              <DollarSign size={21} />
            </div>

            <span className="text-2xl font-bold text-[#17382E]">
              {formatCurrency(summary.totalCollected)}
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#405650]">
            Total Collected
          </p>

          <p className="mt-1 text-xs text-[#8A9691]">
            Confirmed payments
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7E4] text-[#9A7600]">
              <Receipt size={21} />
            </div>

            <span className="text-2xl font-bold text-[#17382E]">
              {summary.pendingCount}
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#405650]">
            Pending Payments
          </p>

          <p className="mt-1 text-xs text-[#8A9691]">
            Awaiting confirmation
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0EE] text-[#B33A31]">
              <AlertCircle size={21} />
            </div>

            <span className="text-2xl font-bold text-[#17382E]">
              {summary.failedCount}
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#405650]">
            Failed Payments
          </p>

          <p className="mt-1 text-xs text-[#8A9691]">
            Payment attempts failed
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F4EF] text-[#0B5D43]">
              <CreditCard size={21} />
            </div>

            <span className="text-2xl font-bold text-[#17382E]">
              {summary.transactionCount}
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#405650]">
            Transactions
          </p>

          <p className="mt-1 text-xs text-[#8A9691]">
            All recorded payments
          </p>
        </div>
      </div>

      {/* PAYMENTS */}
      <div className="rounded-2xl border border-[#E4E5DE] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#ECEDE8] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#17382E]">
              Payment Transactions
            </h2>

            <p className="mt-1 text-xs text-[#8A9691]">
              M-Pesa and school fee payment records.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9691]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search payments..."
                className="h-11 w-full rounded-xl border border-[#DDE1DB] bg-white pl-10 pr-4 text-sm text-[#405650] outline-none focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="h-11 rounded-xl border border-[#DDE1DB] bg-white px-4 text-sm text-[#405650] outline-none focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
            >
              <option value="">All statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Loader2
              size={28}
              className="animate-spin text-[#0B5D43]"
            />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center">
            <Receipt
              size={35}
              className="text-[#A0AAA5]"
            />

            <p className="mt-3 text-sm font-semibold text-[#405650]">
              No payment records found
            </p>

            <p className="mt-1 text-xs text-[#8A9691]">
              Try another search or make a new payment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[#ECEDE8] bg-[#FAFAF7] text-left">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8A9691]">
                    Student
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8A9691]">
                    Amount
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8A9691]">
                    M-Pesa
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8A9691]">
                    Phone
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8A9691]">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8A9691]">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EEF0EB]">
                {filteredPayments.map((payment) => {
                  const student = getStudentById(
                    payment.student,
                    students
                  );

                  return (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-[#FCFCF9]"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-[#17382E]">
                          {getStudentName(student)}
                        </p>

                        <p className="mt-1 text-xs text-[#8A9691]">
                          {student?.admission_number ||
                            "No admission number"}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-[#17382E]">
                          {formatCurrency(payment.amount)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#405650]">
                          {payment.mpesa_receipt_number ||
                            payment.transaction_id ||
                            "Pending"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-[#52645D]">
                        {payment.phone_number || "—"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                            payment.status
                          )}`}
                        >
                          {payment.status || "UNKNOWN"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-[#52645D]">
                        {formatDate(
                          payment.paid_at ||
                            payment.created_at
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LEDGER */}
      <div className="rounded-2xl border border-[#E4E5DE] bg-white shadow-sm">
        <div className="border-b border-[#ECEDE8] p-5">
          <h2 className="text-base font-bold text-[#17382E]">
            Recent Ledger Activity
          </h2>

          <p className="mt-1 text-xs text-[#8A9691]">
            Recorded financial movements.
          </p>
        </div>

        {ledgerEntries.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#8A9691]">
            No ledger entries found.
          </div>
        ) : (
          <div className="divide-y divide-[#EEF0EB]">
            {ledgerEntries.slice(0, 10).map((entry) => {
              const student = getStudentById(
                entry.student,
                students
              );

              return (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#17382E]">
                      {entry.description ||
                        entry.entry_type ||
                        "Ledger entry"}
                    </p>

                    <p className="mt-1 text-xs text-[#8A9691]">
                      {getStudentName(student)}
                      {entry.reference
                        ? ` • ${entry.reference}`
                        : ""}
                    </p>
                  </div>

                  <span className="text-sm font-bold text-[#0B5D43]">
                    {formatCurrency(entry.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17382E]/45 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ECEDE8] p-5">
              <div>
                <h2 className="text-lg font-bold text-[#17382E]">
                  Make M-Pesa Payment
                </h2>

                <p className="mt-1 text-xs text-[#8A9691]">
                  Enter the payment details to initiate an STK
                  Push.
                </p>
              </div>

              <button
                type="button"
                onClick={closePaymentForm}
                disabled={submitting}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#7C8984] transition hover:bg-[#F3F4EF] hover:text-[#17382E] disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handlePaymentSubmit}
              className="space-y-5 p-5"
            >
              {formError && (
                <div className="flex items-start gap-3 rounded-xl border border-[#F0D2CE] bg-[#FFF5F3] p-4 text-sm text-[#B33A31]">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <p>{formError}</p>
                </div>
              )}

              {/* STUDENT */}
              <div>
                <label
                  htmlFor="payment_student"
                  className="mb-2 block text-sm font-semibold text-[#405650]"
                >
                  Student
                  <span className="ml-1 text-[#B33A31]">
                    *
                  </span>
                </label>

                <div className="relative">
                  <User
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9691]"
                  />

                  <select
                    id="payment_student"
                    value={paymentForm.student}
                    onChange={(event) =>
                      updatePaymentField(
                        "student",
                        event.target.value
                      )
                    }
                    disabled={submitting}
                    className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white pl-10 pr-4 text-sm text-[#405650] outline-none focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10 disabled:bg-[#F4F5F1]"
                  >
                    <option value="">
                      Select student
                    </option>

                    {students.map((student) => (
                      <option
                        key={student.id}
                        value={student.id}
                      >
                        {getStudentName(student)}
                        {student.admission_number
                          ? ` — ${student.admission_number}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AMOUNT */}
              <div>
                <label
                  htmlFor="payment_amount"
                  className="mb-2 block text-sm font-semibold text-[#405650]"
                >
                  Amount (KES)
                  <span className="ml-1 text-[#B33A31]">
                    *
                  </span>
                </label>

                <div className="relative">
                  <DollarSign
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9691]"
                  />

                  <input
                    id="payment_amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(event) =>
                      updatePaymentField(
                        "amount",
                        event.target.value
                      )
                    }
                    disabled={submitting}
                    placeholder="e.g. 100"
                    className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white pl-10 pr-4 text-sm text-[#405650] outline-none placeholder:text-[#A0AAA5] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10 disabled:bg-[#F4F5F1]"
                  />
                </div>
              </div>

              {/* PHONE */}
              <div>
                <label
                  htmlFor="payment_phone"
                  className="mb-2 block text-sm font-semibold text-[#405650]"
                >
                  M-Pesa Phone Number
                  <span className="ml-1 text-[#B33A31]">
                    *
                  </span>
                </label>

                <div className="relative">
                  <Phone
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9691]"
                  />

                  <input
                    id="payment_phone"
                    type="tel"
                    value={paymentForm.phone_number}
                    onChange={(event) =>
                      updatePaymentField(
                        "phone_number",
                        event.target.value
                      )
                    }
                    disabled={submitting}
                    placeholder="e.g. 0712345678"
                    autoComplete="tel"
                    className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white pl-10 pr-4 text-sm text-[#405650] outline-none placeholder:text-[#A0AAA5] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10 disabled:bg-[#F4F5F1]"
                  />
                </div>

                <p className="mt-2 text-xs text-[#8A9691]">
                  This number will receive the M-Pesa STK
                  prompt.
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col-reverse gap-3 border-t border-[#ECEDE8] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePaymentForm}
                  disabled={submitting}
                  className="h-11 rounded-xl border border-[#DDE1DB] px-5 text-sm font-semibold text-[#405650] transition hover:bg-[#F7F8F4] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-6 text-sm font-semibold text-white transition hover:bg-[#084A36] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Sending STK...
                    </>
                  ) : (
                    <>
                      <CreditCard size={17} />
                      Pay with M-Pesa
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Finance;