import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";

import api from "../api";

const GRADES = [
  { value: "PP1", label: "PP1" },
  { value: "PP2", label: "PP2" },
  { value: "G1", label: "Grade 1" },
  { value: "G2", label: "Grade 2" },
  { value: "G3", label: "Grade 3" },
  { value: "G4", label: "Grade 4" },
  { value: "G5", label: "Grade 5" },
  { value: "G6", label: "Grade 6" },
];

function getGradeLabel(value) {
  return (
    GRADES.find((grade) => grade.value === value)?.label ||
    value ||
    "—"
  );
}

function getStudentName(student) {
  return [student.first_name, student.last_name]
    .filter(Boolean)
    .join(" ");
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

  const messages = Object.entries(data).flatMap(
    ([field, value]) => {
      if (Array.isArray(value)) {
        return value.map(
          (message) => `${field}: ${message}`
        );
      }

      if (typeof value === "string") {
        return [`${field}: ${value}`];
      }

      return [];
    }
  );

  return messages.length > 0
    ? messages.join(" ")
    : fallback;
}

function Students() {
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [classroomsLoading, setClassroomsLoading] =
    useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    admission_number: "",
    grade: "",
    date_of_birth: "",
    guardian_name: "",
    guardian_phone: "",
    classroom: "",
  });

  async function loadStudents() {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (gradeFilter) {
        params.grade = gradeFilter;
      }

      const response = await api.get("/students/", {
        params,
      });

      const data = response.data;

      setStudents(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (requestError) {
      setError(
        extractErrorMessage(
          requestError,
          "Unable to load students."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadClassrooms() {
    setClassroomsLoading(true);

    try {
      const response = await api.get("/classrooms/", {
        params: {
          page_size: 100,
        },
      });

      const data = response.data;

      setClassrooms(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (requestError) {
      setFormError(
        extractErrorMessage(
          requestError,
          "Unable to load classrooms."
        )
      );
    } finally {
      setClassroomsLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, [gradeFilter]);

  useEffect(() => {
    loadClassrooms();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      const name = getStudentName(student);

      return [
        name,
        student.admission_number,
        student.guardian_name,
        student.guardian_phone,
        getGradeLabel(student.grade),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    });
  }, [students, search]);

  function openForm() {
    setFormError("");
    setSuccessMessage("");

    setForm({
      first_name: "",
      last_name: "",
      admission_number: "",
      grade: "",
      date_of_birth: "",
      guardian_name: "",
      guardian_phone: "",
      classroom: "",
    });

    setShowForm(true);
  }

  function closeForm() {
    if (submitting) {
      return;
    }

    setShowForm(false);
    setFormError("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.admission_number.trim() ||
      !form.grade
    ) {
      setFormError(
        "Please complete the student's required information."
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        admission_number:
          form.admission_number.trim(),
        grade: form.grade,
        date_of_birth:
          form.date_of_birth || null,
        guardian_name: form.guardian_name.trim(),
        guardian_phone: form.guardian_phone.trim(),
      };

      if (form.classroom) {
        payload.classroom = Number(form.classroom);
      }

      await api.post("/students/", payload);

      setShowForm(false);

      setSuccessMessage(
        `${form.first_name.trim()} ${form.last_name.trim()} was added successfully.`
      );

      await loadStudents();
    } catch (requestError) {
      setFormError(
        extractErrorMessage(
          requestError,
          "Unable to add student."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-7">
      {/* HEADER */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B5D43]">
            Learner Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#12382D] sm:text-4xl">
            Students
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71807A] sm:text-base">
            Manage learner records, class placement and
            guardian information across your school.
          </p>
        </div>

        <button
          type="button"
          onClick={openForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#084936] focus:outline-none focus:ring-4 focus:ring-[#0B5D43]/15"
        >
          <Plus size={19} />
          Add Student
        </button>
      </div>

      {/* SUCCESS */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-[#BBDCCB] bg-[#EDF8F1] px-4 py-3 text-sm text-[#17633F]">
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0"
          />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[#F3C5C1] bg-[#FFF3F1] px-4 py-3 text-sm text-[#B42318]">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Students could not be loaded
            </p>

            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
              <Users size={21} />
            </div>

            <span className="text-2xl font-bold text-[#12382D]">
              {students.length}
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#17382E]">
            Total Students
          </p>

          <p className="mt-1 text-xs text-[#8A9691]">
            Learners in your school
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF5E8] text-[#668B2E]">
              <GraduationCap size={21} />
            </div>

            <span className="text-2xl font-bold text-[#12382D]">
              {
                students.filter(
                  (student) => student.grade === "PP1"
                ).length
              }
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#17382E]">
            PP1
          </p>

          <p className="mt-1 text-xs text-[#8A9691]">
            Pre-primary learners
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7E4] text-[#B58A00]">
              <GraduationCap size={21} />
            </div>

            <span className="text-2xl font-bold text-[#12382D]">
              {
                students.filter(
                  (student) => student.grade === "PP2"
                ).length
              }
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#17382E]">
            PP2
          </p>

          <p className="mt-1 text-xs text-[#8A9691]">
            Pre-primary learners
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0EE] text-[#B33A31]">
              <GraduationCap size={21} />
            </div>

            <span className="text-2xl font-bold text-[#12382D]">
              {
                students.filter((student) =>
                  ["G1", "G2", "G3", "G4", "G5", "G6"].includes(
                    student.grade
                  )
                ).length
              }
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#17382E]">
            Grade 1–6
          </p>

          <p className="mt-1 text-xs text-[#8A9691]">
            Primary learners
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-[#E4E5DE] bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9691]"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by student name, admission number or guardian..."
              className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-[#FAFAF7] pl-11 pr-4 text-sm text-[#17382E] outline-none transition placeholder:text-[#9AA49F] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
            />
          </div>

          <select
            value={gradeFilter}
            onChange={(event) =>
              setGradeFilter(event.target.value)
            }
            className="h-12 rounded-xl border border-[#DDE1DB] bg-[#FAFAF7] px-4 text-sm text-[#405650] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
          >
            <option value="">All grades</option>

            {GRADES.map((grade) => (
              <option
                key={grade.value}
                value={grade.value}
              >
                {grade.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STUDENT DIRECTORY */}
      <div className="overflow-hidden rounded-2xl border border-[#E4E5DE] bg-white shadow-sm">
        <div className="border-b border-[#E9E8E1] px-6 py-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#17382E]">
                Student Directory
              </h2>

              <p className="mt-1 text-sm text-[#8A9691]">
                {filteredStudents.length} student
                {filteredStudents.length === 1
                  ? ""
                  : "s"} displayed
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#6D7B75]">
              <Users size={18} />
              {students.length} total
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-[#71807A]">
              <Loader2
                size={20}
                className="animate-spin text-[#0B5D43]"
              />
              Loading students...
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0F4EF] text-[#81918A]">
              <GraduationCap size={30} />
            </div>

            <h3 className="mt-5 text-base font-bold text-[#17382E]">
              No students found
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-[#7C8984]">
              {students.length === 0
                ? "Start building your learner directory by adding your first student."
                : "No students match your current search or grade filter."}
            </p>

            {students.length === 0 && (
              <button
                type="button"
                onClick={openForm}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B5D43] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#084936]"
              >
                <Plus size={17} />
                Add First Student
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#E9E8E1] bg-[#FAFAF7] text-left">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#87948E]">
                      Student
                    </th>

                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#87948E]">
                      Admission No.
                    </th>

                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#87948E]">
                      Grade
                    </th>

                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#87948E]">
                      Classroom
                    </th>

                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#87948E]">
                      Guardian
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-[#EEF0EB] last:border-0 hover:bg-[#FCFCF9]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF3EE] text-sm font-bold text-[#0B5D43]">
                            {student.first_name
                              ?.charAt(0)
                              ?.toUpperCase()}
                            {student.last_name
                              ?.charAt(0)
                              ?.toUpperCase()}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-[#17382E]">
                              {getStudentName(student)}
                            </p>

                            {student.date_of_birth && (
                              <p className="mt-0.5 text-xs text-[#9AA49F]">
                                DOB:{" "}
                                {student.date_of_birth}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-[#52645D]">
                        {student.admission_number}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-[#EAF3EE] px-3 py-1.5 text-xs font-semibold text-[#0B5D43]">
                          {getGradeLabel(student.grade)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-[#52645D]">
                        {student.classroom?.name ||
                          student.classroom_name ||
                          "Not assigned"}
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#405650]">
                          {student.guardian_name ||
                            "Not provided"}
                        </p>

                        {student.guardian_phone && (
                          <p className="mt-1 text-xs text-[#9AA49F]">
                            {student.guardian_phone}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="divide-y divide-[#EEF0EB] lg:hidden">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="space-y-4 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF3EE] text-sm font-bold text-[#0B5D43]">
                      {student.first_name
                        ?.charAt(0)
                        ?.toUpperCase()}
                      {student.last_name
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#17382E]">
                        {getStudentName(student)}
                      </p>

                      <p className="mt-1 text-xs text-[#8A9691]">
                        {student.admission_number}
                      </p>
                    </div>

                    <span className="ml-auto shrink-0 rounded-full bg-[#EAF3EE] px-3 py-1.5 text-xs font-semibold text-[#0B5D43]">
                      {getGradeLabel(student.grade)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#FAFAF7] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8A9691]">
                        Classroom
                      </p>

                      <p className="mt-1 text-sm font-medium text-[#405650]">
                        {student.classroom?.name ||
                          student.classroom_name ||
                          "Not assigned"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#FAFAF7] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8A9691]">
                        Guardian
                      </p>

                      <p className="mt-1 truncate text-sm font-medium text-[#405650]">
                        {student.guardian_name ||
                          "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ADD STUDENT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#03251B]/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-[#E9E8E1] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
                  <GraduationCap size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[#17382E]">
                    Add Student
                  </h2>

                  <p className="mt-0.5 text-xs text-[#8A9691]">
                    Create a new learner record.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-[#7C8984] transition hover:bg-[#F1F3EE] hover:text-[#0B5D43]"
                aria-label="Close student form"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {formError && (
                <div className="flex items-start gap-3 rounded-xl border border-[#F3C5C1] bg-[#FFF3F1] px-4 py-3 text-sm text-[#B42318]">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{formError}</span>
                </div>
              )}

              {/* NAME */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="first_name"
                    className="mb-2 block text-sm font-semibold text-[#405650]"
                  >
                    First Name{" "}
                    <span className="text-[#B33A31]">*</span>
                  </label>

                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={form.first_name}
                    onChange={handleFormChange}
                    placeholder="e.g. Amani"
                    autoComplete="given-name"
                    className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white px-4 text-sm text-[#405650] outline-none transition placeholder:text-[#A0AAA5] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="last_name"
                    className="mb-2 block text-sm font-semibold text-[#405650]"
                  >
                    Last Name{" "}
                    <span className="text-[#B33A31]">*</span>
                  </label>

                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={form.last_name}
                    onChange={handleFormChange}
                    placeholder="e.g. Otieno"
                    autoComplete="family-name"
                    className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white px-4 text-sm text-[#405650] outline-none transition placeholder:text-[#A0AAA5] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
                  />
                </div>
              </div>

              {/* ADMISSION + GRADE */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="admission_number"
                    className="mb-2 block text-sm font-semibold text-[#405650]"
                  >
                    Admission Number{" "}
                    <span className="text-[#B33A31]">*</span>
                  </label>

                  <input
                    id="admission_number"
                    name="admission_number"
                    type="text"
                    value={form.admission_number}
                    onChange={handleFormChange}
                    placeholder="e.g. DAR-001"
                    className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white px-4 text-sm text-[#405650] outline-none transition placeholder:text-[#A0AAA5] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="grade"
                    className="mb-2 block text-sm font-semibold text-[#405650]"
                  >
                    Grade{" "}
                    <span className="text-[#B33A31]">*</span>
                  </label>

                  <select
                    id="grade"
                    name="grade"
                    value={form.grade}
                    onChange={handleFormChange}
                    className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white px-4 text-sm text-[#405650] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
                  >
                    <option value="">
                      Select grade
                    </option>

                    {GRADES.map((grade) => (
                      <option
                        key={grade.value}
                        value={grade.value}
                      >
                        {grade.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DOB + CLASSROOM */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="date_of_birth"
                    className="mb-2 block text-sm font-semibold text-[#405650]"
                  >
                    Date of Birth
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9691]"
                    />

                    <input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      value={form.date_of_birth}
                      onChange={handleFormChange}
                      className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white pl-11 pr-4 text-sm text-[#405650] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="classroom"
                    className="mb-2 block text-sm font-semibold text-[#405650]"
                  >
                    Classroom
                  </label>

                  <select
                    id="classroom"
                    name="classroom"
                    value={form.classroom}
                    onChange={handleFormChange}
                    disabled={classroomsLoading}
                    className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white px-4 text-sm text-[#405650] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10 disabled:bg-[#F4F5F1]"
                  >
                    <option value="">
                      {classroomsLoading
                        ? "Loading classrooms..."
                        : classrooms.length === 0
                          ? "No classrooms available"
                          : "Select classroom"}
                    </option>

                    {classrooms.map((classroom) => (
                      <option
                        key={classroom.id}
                        value={classroom.id}
                      >
                        {classroom.name}
                        {classroom.grade
                          ? ` — ${getGradeLabel(
                              classroom.grade
                            )}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* GUARDIAN */}
              <div className="border-t border-[#E9E8E1] pt-5">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#0B5D43]">
                  Guardian Information
                </p>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="guardian_name"
                      className="mb-2 block text-sm font-semibold text-[#405650]"
                    >
                      Guardian Name
                    </label>

                    <input
                      id="guardian_name"
                      name="guardian_name"
                      type="text"
                      value={form.guardian_name}
                      onChange={handleFormChange}
                      placeholder="e.g. Jane Otieno"
                      className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white px-4 text-sm text-[#405650] outline-none transition placeholder:text-[#A0AAA5] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="guardian_phone"
                      className="mb-2 block text-sm font-semibold text-[#405650]"
                    >
                      Guardian Phone
                    </label>

                    <input
                      id="guardian_phone"
                      name="guardian_phone"
                      type="tel"
                      value={form.guardian_phone}
                      onChange={handleFormChange}
                      placeholder="e.g. 0712345678"
                      autoComplete="tel"
                      className="h-12 w-full rounded-xl border border-[#DDE1DB] bg-white px-4 text-sm text-[#405650] outline-none transition placeholder:text-[#A0AAA5] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
                    />
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col-reverse gap-3 border-t border-[#E9E8E1] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="rounded-xl border border-[#DDE1DB] px-5 py-3 text-sm font-semibold text-[#52645D] transition hover:bg-[#F5F6F2] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#084936] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Save Student
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

export default Students;