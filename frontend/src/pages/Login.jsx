import { useState } from "react";
import {
  GraduationCap,
  LockKeyhole,
  UserRound,
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";

function Login() {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      await login(username, password);
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ||
        "Login failed. Please check your username and password.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-slate-100">
      <section className="hidden flex-1 flex-col justify-between bg-blue-700 p-12 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <GraduationCap size={28} />
            </div>

            <span className="text-2xl font-bold">Darasa-AI</span>
          </div>

          <div className="mt-24 max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Adaptive CBC Infrastructure
            </p>

            <h1 className="text-5xl font-bold leading-tight">
              Smarter learning.
              <br />
              Better outcomes.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-blue-100">
              Empowering schools with adaptive learning, continuous
              assessment, student insights, and streamlined school operations.
            </p>
          </div>
        </div>

        <p className="text-sm text-blue-200">
          © {new Date().getFullYear()} Darasa-AI
        </p>
      </section>

      <section className="flex w-full items-center justify-center px-5 py-10 lg:w-[520px] lg:bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <GraduationCap size={25} />
              </div>

              <span className="text-2xl font-bold text-slate-900">
                Darasa-AI
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-7 shadow-xl lg:rounded-none lg:p-0 lg:shadow-none">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-slate-500">
                Sign in to access your school dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Username
                </label>

                <div className="relative">
                  <UserRound
                    size={19}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    placeholder="Enter your username"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;