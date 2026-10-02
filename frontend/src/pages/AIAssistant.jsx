
import { useState } from "react";
import { Bot, Send, Loader2 } from "lucide-react";

import api from "../api";

function AIAssistant() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await api.post("/ai/assistant/", {
        message: trimmedMessage,
      });

      setResponse(result.data);
      setMessage("");
    } catch (err) {
      console.error("AI Assistant error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to connect to the DARASA-AI Assistant.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Bot size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                DARASA-AI Assistant
              </h1>

              <p className="text-sm text-slate-500">
                Ask questions about learning, students, and competency data.
              </p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="min-h-[420px] p-6">
            {!response && !error && (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <Bot size={32} />
                </div>

                <h2 className="text-lg font-semibold text-slate-800">
                  How can I help?
                </h2>

                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Ask a question and I will use the DARASA-AI data available
                  to your account.
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {response && (
              <div className="space-y-6">
                {/* User Question */}
                <div className="ml-auto max-w-2xl rounded-2xl bg-indigo-600 px-5 py-4 text-white">
                  <p className="text-xs font-medium uppercase tracking-wide text-indigo-200">
                    You
                  </p>

                  <p className="mt-1 text-sm">
                    {response.message}
                  </p>
                </div>

                {/* Assistant Response */}
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Bot size={18} />
                  </div>

                  <div className="max-w-3xl rounded-2xl bg-slate-100 px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      DARASA-AI
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {response.response}
                    </p>
                  </div>
                </div>

                {/* Returned Context */}
                {response.context?.student && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="font-semibold text-slate-800">
                      Student Context
                    </h3>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-slate-500">
                          Student
                        </p>

                        <p className="text-sm font-medium text-slate-800">
                          {response.context.student.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Grade
                        </p>

                        <p className="text-sm font-medium text-slate-800">
                          {response.context.student.grade}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Admission Number
                        </p>

                        <p className="text-sm font-medium text-slate-800">
                          {response.context.student.admission_number}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          School
                        </p>

                        <p className="text-sm font-medium text-slate-800">
                          {response.context.student.school || "Not assigned"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Competencies */}
                {response.context?.competencies?.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-semibold text-slate-800">
                      Recent Competencies
                    </h3>

                    <div className="space-y-3">
                      {response.context.competencies.map(
                        (competency, index) => (
                          <div
                            key={`${competency.learning_area}-${competency.assessed_on}-${index}`}
                            className="rounded-xl border border-slate-200 bg-white p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-medium text-slate-800">
                                  {competency.learning_area}
                                </p>

                                <p className="text-sm text-slate-500">
                                  {competency.strand}
                                  {competency.sub_strand
                                    ? ` • ${competency.sub_strand}`
                                    : ""}
                                </p>
                              </div>

                              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                {competency.mastery_label}
                              </span>
                            </div>

                            {competency.teacher_notes && (
                              <p className="mt-3 text-sm text-slate-600">
                                {competency.teacher_notes}
                              </p>
                            )}

                            <p className="mt-2 text-xs text-slate-400">
                              Assessed on {competency.assessed_on}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-200 p-4"
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask DARASA-AI something..."
                disabled={loading}
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
              />

              <button
                type="submit"
                disabled={!message.trim() || loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}

                <span className="hidden sm:inline">
                  {loading ? "Thinking..." : "Ask"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;
