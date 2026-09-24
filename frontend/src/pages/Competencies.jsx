import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  BookOpenCheck,
  ChevronRight,
  Filter,
  GraduationCap,
  Loader2,
  Search,
  TrendingUp,
} from "lucide-react";

import api from "../api";

const learningAreas = [
  { value: "", label: "All learning areas" },
  { value: "MATH", label: "Mathematics" },
  { value: "ENG", label: "English" },
  { value: "KIS", label: "Kiswahili" },
  { value: "SCI", label: "Science & Technology" },
  { value: "SST", label: "Social Studies" },
  { value: "CRE", label: "Christian Religious Education" },
  { value: "CA", label: "Creative Arts" },
  { value: "AGR", label: "Agriculture" },
];

const masteryLevels = [
  { value: "", label: "All mastery levels" },
  { value: "EE", label: "Exceeds Expectation" },
  { value: "ME", label: "Meets Expectation" },
  { value: "AE", label: "Approaches Expectation" },
  { value: "BE", label: "Below Expectation" },
];

const masteryStyles = {
  EE: {
    label: "Exceeds Expectation",
    className: "bg-[#EAF3EE] text-[#0B5D43]",
  },
  ME: {
    label: "Meets Expectation",
    className: "bg-[#EEF5E9] text-[#657A28]",
  },
  AE: {
    label: "Approaches Expectation",
    className: "bg-[#FFF9E7] text-[#94720D]",
  },
  BE: {
    label: "Below Expectation",
    className: "bg-[#FFF1EF] text-[#A33A32]",
  },
};

function Competencies() {
  const [competencies, setCompetencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [learningArea, setLearningArea] = useState("");
  const [masteryLevel, setMasteryLevel] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCompetencies() {
      try {
        setLoading(true);
        setError("");

        const params = {};

        if (learningArea) {
          params.learning_area = learningArea;
        }

        if (masteryLevel) {
          params.mastery_level = masteryLevel;
        }

        const response = await api.get("/competencies/", {
          params,
        });

        if (!isMounted) {
          return;
        }

        const data = response.data;

        setCompetencies(
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
            "Unable to load CBC assessment records."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCompetencies();

    return () => {
      isMounted = false;
    };
  }, [learningArea, masteryLevel]);

  const getStudentName = (competency) => {
    const student = competency.student;

    if (typeof student === "string") {
      return student;
    }

    if (student?.name) {
      return student.name;
    }

    const name = [
      student?.first_name,
      student?.middle_name,
      student?.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    return name || `Student #${student?.id || competency.student || "—"}`;
  };

  const getLearningAreaName = (value) => {
    return (
      learningAreas.find((area) => area.value === value)?.label ||
      value ||
      "Not specified"
    );
  };

  const getMastery = (value) => {
    return (
      masteryStyles[value] || {
        label: value || "Not assessed",
        className: "bg-[#F1F3EE] text-[#65736E]",
      }
    );
  };

  const filteredCompetencies = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return competencies;
    }

    return competencies.filter((competency) => {
      const searchableText = [
        getStudentName(competency),
        competency.strand,
        competency.sub_strand,
        getLearningAreaName(competency.learning_area),
        getMastery(competency.mastery_level).label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [competencies, search]);

  const masterySummary = useMemo(() => {
    return competencies.reduce(
      (summary, competency) => {
        const level = competency.mastery_level;

        if (summary[level] !== undefined) {
          summary[level] += 1;
        }

        return summary;
      },
      {
        EE: 0,
        ME: 0,
        AE: 0,
        BE: 0,
      }
    );
  }, [competencies]);

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <section>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0B5D43]">
              Competency Based Curriculum
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#17382E] sm:text-4xl">
              CBC Assessment
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65736E] sm:text-base">
              Track learner competency development, mastery levels and
              assessment evidence across learning areas.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#D9E7DF] bg-[#F3F8F5] px-4 py-3">
            <BookOpenCheck size={19} className="text-[#0B5D43]" />

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8A9691]">
                Assessment records
              </p>

              <p className="text-lg font-bold text-[#0B5D43]">
                {loading ? "—" : competencies.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mastery overview */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            key: "EE",
            label: "Exceeds",
            description: "Strong mastery",
            icon: TrendingUp,
          },
          {
            key: "ME",
            label: "Meets",
            description: "Expected mastery",
            icon: BookOpenCheck,
          },
          {
            key: "AE",
            label: "Approaches",
            description: "Needs reinforcement",
            icon: BarChart3,
          },
          {
            key: "BE",
            label: "Below",
            description: "Needs targeted support",
            icon: GraduationCap,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.key}
              className="rounded-2xl border border-[#E1E4DE] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-xl",
                    item.key === "EE"
                      ? "bg-[#EAF3EE] text-[#0B5D43]"
                      : item.key === "ME"
                        ? "bg-[#EEF5E9] text-[#657A28]"
                        : item.key === "AE"
                          ? "bg-[#FFF9E7] text-[#94720D]"
                          : "bg-[#FFF1EF] text-[#A33A32]",
                  ].join(" ")}
                >
                  <Icon size={21} />
                </div>

                <span className="text-2xl font-bold text-[#17382E]">
                  {loading ? "—" : masterySummary[item.key]}
                </span>
              </div>

              <p className="mt-5 text-sm font-semibold text-[#405650]">
                {item.label}
              </p>

              <p className="mt-1 text-xs text-[#8A9691]">
                {item.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* Filters */}
      <section className="rounded-2xl border border-[#E1E4DE] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9691]"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by student, strand or learning area..."
              className="h-11 w-full rounded-xl border border-[#DDE2DD] bg-[#F8F7F2] pl-11 pr-4 text-sm text-[#17382E] outline-none transition placeholder:text-[#9AA49F] focus:border-[#0B5D43] focus:bg-white focus:ring-4 focus:ring-[#EAF3EE]"
            />
          </div>

          <select
            value={learningArea}
            onChange={(event) => setLearningArea(event.target.value)}
            className="h-11 rounded-xl border border-[#DDE2DD] bg-[#F8F7F2] px-4 text-sm font-medium text-[#405650] outline-none transition focus:border-[#0B5D43] focus:bg-white focus:ring-4 focus:ring-[#EAF3EE] xl:w-56"
          >
            {learningAreas.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}
              </option>
            ))}
          </select>

          <select
            value={masteryLevel}
            onChange={(event) => setMasteryLevel(event.target.value)}
            className="h-11 rounded-xl border border-[#DDE2DD] bg-[#F8F7F2] px-4 text-sm font-medium text-[#405650] outline-none transition focus:border-[#0B5D43] focus:bg-white focus:ring-4 focus:ring-[#EAF3EE] xl:w-56"
          >
            {masteryLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
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
              CBC assessment records could not be loaded
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
            Loading assessment records...
          </div>
        </div>
      )}

      {/* Assessment directory */}
      {!loading && !error && (
        <section className="overflow-hidden rounded-2xl border border-[#E1E4DE] bg-white shadow-sm">
          <div className="border-b border-[#E9E8E1] px-5 py-4 sm:px-6">
            <h2 className="text-base font-bold text-[#17382E]">
              Assessment Records
            </h2>

            <p className="mt-1 text-sm text-[#65736E]">
              {filteredCompetencies.length === 0
                ? "No assessments match the current filters."
                : `${filteredCompetencies.length} assessment${
                    filteredCompetencies.length === 1 ? "" : "s"
                  } displayed`}
            </p>
          </div>

          {filteredCompetencies.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F3EE] text-[#8A9691]">
                <BookOpenCheck size={26} />
              </div>

              <h3 className="mt-5 text-base font-bold text-[#17382E]">
                No assessments found
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-[#65736E]">
                There are no competency assessment records matching
                your current filters.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-[#E9E8E1] bg-[#F8F7F2] text-left">
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#8A9691]">
                        Student
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#8A9691]">
                        Learning Area
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#8A9691]">
                        Strand
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#8A9691]">
                        Mastery
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#8A9691]">
                        Assessed
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#8A9691]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#EEF0EB]">
                    {filteredCompetencies.map((competency) => {
                      const mastery = getMastery(
                        competency.mastery_level
                      );

                      return (
                        <tr
                          key={competency.id}
                          className="transition hover:bg-[#F8FAF7]"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF3EE] text-sm font-bold text-[#0B5D43]">
                                {getStudentName(competency)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-[#17382E]">
                                  {getStudentName(competency)}
                                </p>

                                <p className="text-xs text-[#9AA49F]">
                                  Assessment #{competency.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-sm font-medium text-[#405650]">
                            {getLearningAreaName(
                              competency.learning_area
                            )}
                          </td>

                          <td className="max-w-[220px] px-6 py-4">
                            <p className="truncate text-sm text-[#405650]">
                              {competency.strand || "—"}
                            </p>

                            {competency.sub_strand && (
                              <p className="mt-1 truncate text-xs text-[#9AA49F]">
                                {competency.sub_strand}
                              </p>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${mastery.className}`}
                            >
                              {mastery.label}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm text-[#65736E]">
                            {competency.assessed_on || "—"}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-[#EEF0EB] md:hidden">
                {filteredCompetencies.map((competency) => {
                  const mastery = getMastery(
                    competency.mastery_level
                  );

                  return (
                    <div key={competency.id} className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF3EE] text-sm font-bold text-[#0B5D43]">
                          {getStudentName(competency)
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[#17382E]">
                            {getStudentName(competency)}
                          </p>

                          <p className="mt-1 text-xs text-[#9AA49F]">
                            {getLearningAreaName(
                              competency.learning_area
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          className="rounded-lg p-2 text-[#8A9691] transition hover:bg-[#F1F3EE] hover:text-[#0B5D43]"
                          aria-label={`View assessment for ${getStudentName(
                            competency
                          )}`}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>

                      <div className="mt-4">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${mastery.className}`}
                        >
                          {mastery.label}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-[#F8F7F2] p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A9691]">
                            Strand
                          </p>

                          <p className="mt-1 truncate text-sm font-semibold text-[#405650]">
                            {competency.strand || "—"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#F8F7F2] p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A9691]">
                            Assessed
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#405650]">
                            {competency.assessed_on || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

export default Competencies;