import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Mail,
  Phone,
  Plus,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import api from "../api";

const EMPTY_FORM = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  phone: "",
  classrooms: [],
};

function getResults(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.results ?? [];
}

function getUserName(teacher) {
  const user = teacher?.user;

  if (typeof user === "object" && user) {
    const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();

    return fullName || user.username || `Teacher #${teacher.id}`;
  }

  return `Teacher #${teacher.id}`;
}

function getUsername(teacher) {
  if (typeof teacher?.user === "object" && teacher.user) {
    return teacher.user.username || "";
  }

  return "";
}

function getTeacherInitials(teacher) {
  const name = getUserName(teacher);
  const parts = name.split(" ").filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getErrorMessage(error, fallback) {
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

  const messages = [];

  Object.entries(data).forEach(([field, value]) => {
    const values = Array.isArray(value) ? value : [value];

    values.forEach((message) => {
      if (typeof message === "string") {
        messages.push(
          field === "non_field_errors"
            ? message
            : `${field.replaceAll("_", " ")}: ${message}`
        );
      }
    });
  });

  return messages.length ? messages.join(" ") : fallback;
}

function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [teachersResponse, classroomsResponse] = await Promise.all([
        api.get("/teachers/"),
        api.get("/classrooms/", {
          params: {
            page_size: 100,
          },
        }),
      ]);

      setTeachers(getResults(teachersResponse.data));
      setClassrooms(getResults(classroomsResponse.data));
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to load teachers and classrooms."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return teachers;
    }

    return teachers.filter((teacher) => {
      const name = getUserName(teacher).toLowerCase();
      const username = getUsername(teacher).toLowerCase();
      const phone = String(teacher.phone ?? "").toLowerCase();

      return (
        name.includes(query) ||
        username.includes(query) ||
        phone.includes(query)
      );
    });
  }, [teachers, search]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleClassroom(classroomId) {
    setForm((current) => {
      const exists = current.classrooms.includes(classroomId);

      return {
        ...current,
        classrooms: exists
          ? current.classrooms.filter((id) => id !== classroomId)
          : [...current.classrooms, classroomId],
      };
    });
  }

  function openModal() {
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (submitting) {
      return;
    }

    setShowModal(false);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      /*
       * The backend UserAccountSerializer creates the UserProfile
       * and automatically creates the Teacher record when role=TEACHER.
       */
      const userResponse = await api.post("/users/", {
        username: form.username.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "TEACHER",
      });

      const createdUser = userResponse.data;

      /*
       * Find the automatically-created Teacher record.
       * We fetch the teacher list rather than assuming a teacher ID.
       */
      const teachersResponse = await api.get("/teachers/");
      const updatedTeachers = getResults(teachersResponse.data);

      const createdTeacher = updatedTeachers.find((teacher) => {
        if (typeof teacher.user === "object" && teacher.user) {
          return teacher.user.id === createdUser.id;
        }

        return teacher.user === createdUser.id;
      });

      if (!createdTeacher) {
        throw new Error(
          "Teacher account was created, but the teacher profile could not be found."
        );
      }

      await api.patch(`/teachers/${createdTeacher.id}/`, {
        phone: form.phone.trim(),
        classrooms: form.classrooms,
      });

      setTeachers(updatedTeachers);
      setSuccess("Teacher account created successfully.");
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          requestError?.message || "Unable to create teacher."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  const teacherCount = teachers.length;

  const assignedClassroomCount = teachers.reduce((total, teacher) => {
    return total + (teacher.classrooms?.length ?? 0);
  }, 0);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0B5D43]">
            Staff Management
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-[#17382E] sm:text-4xl">
            Teachers
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#70807A]">
            Manage teaching staff, classroom assignments and teacher accounts
            across your school.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#084936]"
        >
          <Plus size={18} />
          Add Teacher
        </button>
      </div>

      {error && !showModal && (
        <div className="rounded-xl border border-[#F1C8C3] bg-[#FFF4F2] px-4 py-3 text-sm text-[#A33A32]">
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-[#CFE4D8] bg-[#F0F8F3] px-4 py-3 text-sm text-[#0B5D43]">
          <Check size={17} />
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
              <Users size={21} />
            </div>

            <span className="text-2xl font-bold text-[#17382E]">
              {teacherCount}
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#405650]">
            Teaching Staff
          </p>

          <p className="mt-1 text-xs text-[#8A9691]">
            Active teacher accounts
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7DF] text-[#B28719]">
              <UserPlus size={21} />
            </div>

            <span className="text-2xl font-bold text-[#17382E]">
              {assignedClassroomCount}
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#405650]">
            Classroom Assignments
          </p>

          <p className="mt-1 text-xs text-[#8A9691]">
            Current teacher-classroom links
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F4EF] text-[#0B5D43]">
              <Mail size={21} />
            </div>

            <span className="text-2xl font-bold text-[#17382E]">
              {teachers.filter(
                (teacher) => getUsername(teacher)
              ).length}
            </span>
          </div>

          <p className="mt-5 text-sm font-semibold text-[#405650]">
            Teacher Accounts
          </p>

          <p className="mt-1 text-xs text-[#8A9691]">
            Connected application accounts
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E4E5DE] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#ECEDE8] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#17382E]">
              Teacher Directory
            </h2>

            <p className="mt-1 text-xs text-[#8A9691]">
              Search and review your school's teaching staff.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA49F]"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search teachers..."
              className="w-full rounded-xl border border-[#DDE1DB] bg-[#FAFBF8] py-2.5 pl-10 pr-4 text-sm text-[#17382E] outline-none transition placeholder:text-[#A5AEAA] focus:border-[#0B5D43] focus:ring-2 focus:ring-[#0B5D43]/10"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-[#7B8984]">
            Loading teachers...
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3EE] text-[#0B5D43]">
              <Users size={25} />
            </div>

            <h3 className="mt-4 text-base font-bold text-[#17382E]">
              {search ? "No teachers found" : "No teachers yet"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-[#7B8984]">
              {search
                ? "Try a different search term."
                : "Add your first teacher to start building your school's teaching directory."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B5D43] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#084936]"
              >
                <Plus size={17} />
                Add Teacher
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#ECEDE8]">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-[#FBFCF9] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF3EE] text-sm font-bold text-[#0B5D43]">
                    {getTeacherInitials(teacher)}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-[#17382E]">
                      {getUserName(teacher)}
                    </h3>

                    <p className="mt-1 truncate text-xs text-[#8A9691]">
                      @{getUsername(teacher) || "teacher"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#66756F]">
                  {teacher.phone && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F4F6F2] px-2.5 py-1.5">
                      <Phone size={14} />
                      {teacher.phone}
                    </span>
                  )}

                  <span className="rounded-lg bg-[#FFF7DF] px-2.5 py-1.5 font-medium text-[#8B6B14]">
                    {teacher.classrooms?.length ?? 0} classroom
                    {(teacher.classrooms?.length ?? 0) === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#03251B]/55 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8EAE4] bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-[#17382E]">
                  Add Teacher
                </h2>

                <p className="mt-1 text-xs text-[#8A9691]">
                  Create a teacher account and assign classrooms.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg p-2 text-[#7D8A85] transition hover:bg-[#F2F4EF] hover:text-[#0B5D43]"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-6">
              {error && (
                <div className="rounded-xl border border-[#F1C8C3] bg-[#FFF4F2] px-4 py-3 text-sm text-[#A33A32]">
                  {error}
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-[#17382E]">
                  Teacher Information
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[#52635D]">
                      First name
                    </span>

                    <input
                      required
                      value={form.first_name}
                      onChange={(event) =>
                        updateField("first_name", event.target.value)
                      }
                      className="w-full rounded-xl border border-[#DDE1DB] px-3.5 py-2.5 text-sm outline-none focus:border-[#0B5D43] focus:ring-2 focus:ring-[#0B5D43]/10"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[#52635D]">
                      Last name
                    </span>

                    <input
                      required
                      value={form.last_name}
                      onChange={(event) =>
                        updateField("last_name", event.target.value)
                      }
                      className="w-full rounded-xl border border-[#DDE1DB] px-3.5 py-2.5 text-sm outline-none focus:border-[#0B5D43] focus:ring-2 focus:ring-[#0B5D43]/10"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[#52635D]">
                      Username
                    </span>

                    <input
                      required
                      value={form.username}
                      onChange={(event) =>
                        updateField("username", event.target.value)
                      }
                      placeholder="e.g. jane.wanjiku"
                      className="w-full rounded-xl border border-[#DDE1DB] px-3.5 py-2.5 text-sm outline-none focus:border-[#0B5D43] focus:ring-2 focus:ring-[#0B5D43]/10"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[#52635D]">
                      Phone
                    </span>

                    <input
                      value={form.phone}
                      onChange={(event) =>
                        updateField("phone", event.target.value)
                      }
                      placeholder="e.g. 0712345678"
                      className="w-full rounded-xl border border-[#DDE1DB] px-3.5 py-2.5 text-sm outline-none focus:border-[#0B5D43] focus:ring-2 focus:ring-[#0B5D43]/10"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-xs font-semibold text-[#52635D]">
                      Email
                    </span>

                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateField("email", event.target.value)
                      }
                      placeholder="teacher@school.ac.ke"
                      className="w-full rounded-xl border border-[#DDE1DB] px-3.5 py-2.5 text-sm outline-none focus:border-[#0B5D43] focus:ring-2 focus:ring-[#0B5D43]/10"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-xs font-semibold text-[#52635D]">
                      Temporary password
                    </span>

                    <input
                      required
                      minLength={8}
                      type="password"
                      value={form.password}
                      onChange={(event) =>
                        updateField("password", event.target.value)
                      }
                      placeholder="At least 8 characters"
                      className="w-full rounded-xl border border-[#DDE1DB] px-3.5 py-2.5 text-sm outline-none focus:border-[#0B5D43] focus:ring-2 focus:ring-[#0B5D43]/10"
                    />

                    <p className="mt-1.5 text-[11px] text-[#8A9691]">
                      The teacher can use this account to sign in.
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#17382E]">
                      Classroom Assignment
                    </h3>

                    <p className="mt-1 text-xs text-[#8A9691]">
                      Select the classrooms this teacher manages.
                    </p>
                  </div>

                  <span className="rounded-lg bg-[#EAF3EE] px-2.5 py-1 text-xs font-semibold text-[#0B5D43]">
                    {form.classrooms.length} selected
                  </span>
                </div>

                <div className="mt-4 grid max-h-52 gap-2 overflow-y-auto rounded-xl border border-[#E4E5DE] bg-[#FAFBF8] p-3 sm:grid-cols-2">
                  {classrooms.length === 0 ? (
                    <p className="col-span-full py-5 text-center text-xs text-[#8A9691]">
                      No classrooms available. Create classrooms first.
                    </p>
                  ) : (
                    classrooms.map((classroom) => {
                      const selected = form.classrooms.includes(classroom.id);

                      return (
                        <button
                          key={classroom.id}
                          type="button"
                          onClick={() => toggleClassroom(classroom.id)}
                          className={[
                            "flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition",
                            selected
                              ? "border-[#0B5D43] bg-[#EAF3EE]"
                              : "border-[#E4E5DE] bg-white hover:border-[#B8C9C0]",
                          ].join(" ")}
                        >
                          <div>
                            <p
                              className={[
                                "text-sm font-semibold",
                                selected
                                  ? "text-[#0B5D43]"
                                  : "text-[#405650]",
                              ].join(" ")}
                            >
                              {classroom.name}
                            </p>

                            <p className="mt-0.5 text-[11px] text-[#8A9691]">
                              {classroom.grade}
                            </p>
                          </div>

                          {selected && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0B5D43] text-white">
                              <Check size={14} />
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#E8EAE4] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-xl border border-[#DDE1DB] px-5 py-2.5 text-sm font-semibold text-[#52635D] transition hover:bg-[#F5F6F2]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#084936] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    "Creating..."
                  ) : (
                    <>
                      <UserPlus size={17} />
                      Create Teacher
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Teachers;