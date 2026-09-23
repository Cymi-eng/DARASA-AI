import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronRight,
  Filter,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  Users,
} from "lucide-react";

import api from "../api";

const gradeOptions = [
  { value: "", label: "All grades" },
  { value: "PP1", label: "PP1" },
  { value: "PP2", label: "PP2" },
  { value: "G1", label: "Grade 1" },
  { value: "G2", label: "Grade 2" },
  { value: "G3", label: "Grade 3" },
  { value: "G4", label: "Grade 4" },
  { value: "G5", label: "Grade 5" },
  { value: "G6", label: "Grade 6" },
];

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStudents() {
      try {
        setLoading(true);
        setError("");

        const params = {};

        if (grade) {
          params.grade = grade;
        }

        const response = await api.get("/students/", {
          params,
        });

        if (!isMounted) {
          return;
        }

        const data = response.data;

        setStudents(
          Array.isArray(data)
            ? data
            : Array.isArray(data.results)
              ? data.results
              : []
        );
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(
          requestError.response?.data?.detail ||
            "Unable to load student records."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadStudents();

    return () => {
      isMounted = false;
    };
  }, [grade]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return students;
    }

    return students.filter((student) => {
      const searchableText = [
        student.first_name,
        student.last_name,
        student.admission_number,
        student.grade,
        student.classroom?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [students, search]);

  const getStudentName = (student) => {
    const name = [
      student.first_name,
      student.middle_name,
      student.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    return name || "Unnamed student";
  };

  const getClassroomName = (student) => {
    if (!student.classroom) {
      return "Not assigned";
    }

    if (typeof student.classroom === "string") {
      return student.classroom;
    }

    return student.classroom.name || "Not assigned";
  };

  const getGradeLabel = (value) => {
    return (
      gradeOptions.find((option) => option.value === value)?.label ||
      value ||
      "Not assigned"
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Learner Management
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Students
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Manage learner records, grades and classroom assignments.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <Plus size={18} />
            Add Student
          </button>
        </div>
      </section>

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={21} />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Total students
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {loading ? "—" : students.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <GraduationCap size={21} />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Showing
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {loading
                  ? "—"
                  : filteredStudents.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Filter size={21} />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Current grade filter
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {getGradeLabel(grade)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, admission number or classroom..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <select
            value={grade}
            onChange={(event) => setGrade(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 lg:w-48"
          >
            {gradeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Error */}
      {!loading && error && (
        <div
          role="alert"
          className="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
        >
          <AlertCircle size={21} className="mt-0.5 shrink-0" />

          <div>
            <p className="font-semibold">
              Student records could not be loaded
            </p>

            <p className="mt-1 text-sm leading-6 text-red-600">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <Loader2 className="animate-spin" size={20} />
            Loading student records...
          </div>
        </div>
      )}

      {/* Student table */}
      {!loading && !error && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="text-base font-bold text-slate-900">
              Student Directory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredStudents.length === 0
                ? "No students match the current filters."
                : `${filteredStudents.length} student${
                    filteredStudents.length === 1 ? "" : "s"
                  } displayed`}
            </p>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <GraduationCap size={26} />
              </div>

              <h3 className="mt-5 text-base font-bold text-slate-900">
                No students found
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are no learner records matching your current search
                or grade filter.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Student
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Admission No.
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Grade
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Classroom
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                              {getStudentName(student)
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {getStudentName(student)}
                              </p>

                              <p className="text-xs text-slate-400">
                                Student #{student.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {student.admission_number || "—"}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {getGradeLabel(student.grade)}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {getClassroomName(student)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                          >
                            View
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                        {getStudentName(student)
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {getStudentName(student)}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {student.admission_number || "No admission number"}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                        aria-label={`View ${getStudentName(student)}`}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Grade
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {getGradeLabel(student.grade)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Classroom
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                          {getClassroomName(student)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default Students;