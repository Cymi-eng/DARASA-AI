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

const roleLabels = {
  ADMIN: "Administrator",
  TEACHER: "Teacher",
  BURSAR: "Bursar",
  STUDENT: "Student",
};

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTeachers() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/teachers/");

        if (!isMounted) {
          return;
        }

        const data = response.data;

        setTeachers(
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
            "Unable to load teacher records."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTeachers();

    return () => {
      isMounted = false;
    };
  }, []);

  const getTeacherName = (teacher) => {
    if (teacher.name) {
      return teacher.name;
    }

    const user = teacher.user;

    if (typeof user === "string") {
      return user;
    }

    const name = [
      user?.first_name,
      user?.middle_name,
      user?.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    return name || teacher.username || "Unnamed teacher";
  };

  const getEmail = (teacher) => {
    if (teacher.email) {
      return teacher.email;
    }

    return teacher.user?.email || "No email provided";
  };

  const getRole = (teacher) => {
    if (teacher.role) {
      return roleLabels[teacher.role] || teacher.role;
    }

    return "Teacher";
  };

  const getClassroomName = (teacher) => {
    if (!teacher.classroom) {
      return "Not assigned";
    }

    if (typeof teacher.classroom === "string") {
      return teacher.classroom;
    }

    return teacher.classroom.name || "Not assigned";
  };

  const filteredTeachers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return teachers;
    }

    return teachers.filter((teacher) => {
      const searchableText = [
        getTeacherName(teacher),
        getEmail(teacher),
        getRole(teacher),
        getClassroomName(teacher),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [teachers, search]);

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <section>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0B5D43]">
              Staff Management
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#17382E] sm:text-4xl">
              Teachers
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65736E] sm:text-base">
              Manage teaching staff, classroom assignments and school
              teaching personnel.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#084936] focus:outline-none focus:ring-4 focus:ring-[#DCEDE5]"
          >
            <Plus size={18} />
            Add Teacher
          </button>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#E1E4DE] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
              <Users size={21} />
            </div>

            <div>
              <p className="text-sm font-medium text-[#65736E]">
                Total teachers
              </p>

              <p className="mt-1 text-2xl font-bold text-[#17382E]">
                {loading ? "—" : teachers.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E1E4DE] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0F5E9] text-[#657A28]">
              <GraduationCap size={21} />
            </div>

            <div>
              <p className="text-sm font-medium text-[#65736E]">
                Showing
              </p>

              <p className="mt-1 text-2xl font-bold text-[#17382E]">
                {loading
                  ? "—"
                  : filteredTeachers.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E1E4DE] bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF9E7] text-[#94720D]">
              <Filter size={21} />
            </div>

            <div>
              <p className="text-sm font-medium text-[#65736E]">
                Staff directory
              </p>

              <p className="mt-1 text-lg font-bold text-[#17382E]">
                Teaching Staff
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="rounded-2xl border border-[#E1E4DE] bg-white p-4 shadow-sm sm:p-5">
        <div className="relative">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9691]"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by teacher name, email or classroom..."
            className="h-11 w-full rounded-xl border border-[#DDE2DD] bg-[#F8F7F2] pl-11 pr-4 text-sm text-[#17382E] outline-none transition placeholder:text-[#9AA49F] focus:border-[#0B5D43] focus:bg-white focus:ring-4 focus:ring-[#EAF3EE]"
          />
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
              Teacher records could not be loaded
            </p>

            <p className="mt-1 text-sm leading-6 text-red-600">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-[#E1E4DE] bg-white shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-[#65736E]">
            <Loader2
              className="animate-spin text-[#0B5D43]"
              size={20}
            />
            Loading teacher records...
          </div>
        </div>
      )}

      {/* Teacher directory */}
      {!loading && !error && (
        <section className="overflow-hidden rounded-2xl border border-[#E1E4DE] bg-white shadow-sm">
          <div className="border-b border-[#E9E8E1] px-5 py-4 sm:px-6">
            <h2 className="text-base font-bold text-[#17382E]">
              Teaching Staff Directory
            </h2>

            <p className="mt-1 text-sm text-[#65736E]">
              {filteredTeachers.length === 0
                ? "No teachers match the current search."
                : `${filteredTeachers.length} teacher${
                    filteredTeachers.length === 1 ? "" : "s"
                  } displayed`}
            </p>
          </div>

          {filteredTeachers.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F3EE] text-[#8A9691]">
                <Users size={26} />
              </div>

              <h3 className="mt-5 text-base font-bold text-[#17382E]">
                No teachers found
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#65736E]">
                There are no teacher records matching your current
                search.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-[#E9E8E1] bg-[#F8F7F2] text-left">
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#8A9691]">
                        Teacher
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#8A9691]">
                        Email
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#8A9691]">
                        Role
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#8A9691]">
                        Classroom
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#8A9691]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#EEF0EB]">
                    {filteredTeachers.map((teacher) => (
                      <tr
                        key={teacher.id}
                        className="transition hover:bg-[#F8FAF7]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF3EE] text-sm font-bold text-[#0B5D43]">
                              {getTeacherName(teacher)
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-[#17382E]">
                                {getTeacherName(teacher)}
                              </p>

                              <p className="text-xs text-[#9AA49F]">
                                Staff #{teacher.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-[#65736E]">
                          {getEmail(teacher)}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-lg bg-[#F1F3EE] px-2.5 py-1 text-xs font-semibold text-[#405650]">
                            {getRole(teacher)}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-[#65736E]">
                          {getClassroomName(teacher)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-[#0B5D43] transition hover:text-[#084936]"
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
              <div className="divide-y divide-[#EEF0EB] md:hidden">
                {filteredTeachers.map((teacher) => (
                  <div key={teacher.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF3EE] text-sm font-bold text-[#0B5D43]">
                        {getTeacherName(teacher)
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#17382E]">
                          {getTeacherName(teacher)}
                        </p>

                        <p className="mt-1 truncate text-xs text-[#9AA49F]">
                          {getEmail(teacher)}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="rounded-lg p-2 text-[#8A9691] transition hover:bg-[#F1F3EE] hover:text-[#0B5D43]"
                        aria-label={`View ${getTeacherName(teacher)}`}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#F8F7F2] p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A9691]">
                          Role
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#405650]">
                          {getRole(teacher)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F8F7F2] p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A9691]">
                          Classroom
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-[#405650]">
                          {getClassroomName(teacher)}
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

export default Teachers;