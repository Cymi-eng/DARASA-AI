import { useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  UsersRound,
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
        "Unable to sign in. Please verify your credentials and try again.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f3ea] lg:flex">
      {/* Left: Education story */}
      <section className="relative hidden min-h-screen overflow-hidden lg:flex lg:w-[58%]">
        {/* Replace this image URL with the final approved Darasa-AI classroom
            asset when we add the production image to /public. */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1800&q=85')",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#082f24] via-[#0b3f30]/55 to-[#123f31]/20" />

        <div className="absolute inset-0 bg-gradient-to-r from-[#082f24]/40 via-transparent to-[#082f24]/10" />

        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm">
              <GraduationCap size={27} />
            </div>

            <div>
              <p className="text-2xl font-bold tracking-tight text-white">
                Darasa-AI
              </p>

              <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-100">
                Adaptive Learning
              </p>
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-[#f2c94c]">
              Empowering Kenya's CBC Journey
            </p>

            <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-white xl:text-6xl">
              Every child learns.
              <br />
              <span className="text-[#f2c94c]">Every competency counts.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-white/85 xl:text-lg">
              Darasa-AI brings adaptive learning, continuous assessment, and
              actionable educational insights into one intelligent platform
              designed for Kenyan schools.
            </p>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/20 pt-7">
              <div>
                <UsersRound className="mb-3 text-[#f2c94c]" size={24} />
                <p className="text-sm font-semibold text-white">
                  Personalized
                </p>
                <p className="mt-1 text-xs leading-5 text-white/65">
                  Learner support
                </p>
              </div>

              <div>
                <BookOpenCheck className="mb-3 text-[#f2c94c]" size={24} />
                <p className="text-sm font-semibold text-white">
                  CBC aligned
                </p>
                <p className="mt-1 text-xs leading-5 text-white/65">
                  Continuous assessment
                </p>
              </div>

              <div>
                <GraduationCap className="mb-3 text-[#f2c94c]" size={24} />
                <p className="text-sm font-semibold text-white">
                  Data driven
                </p>
                <p className="mt-1 text-xs leading-5 text-white/65">
                  Better decisions
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/55">
            Darasa-AI • Education Management & Adaptive Learning Platform
          </p>
        </div>
      </section>

      {/* Right: Authentication */}
      <section className="flex min-h-screen w-full items-center justify-center px-5 py-10 lg:w-[42%] lg:px-10 xl:px-16">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b5d43] text-white">
              <GraduationCap size={24} />
            </div>

            <div>
              <p className="text-xl font-bold text-[#0b3f30]">Darasa-AI</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b6b22]">
                Adaptive Learning
              </p>
            </div>
          </div>

          <div className="mb-9">
            <div className="mb-7 hidden items-center gap-3 lg:flex">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b5d43] text-white shadow-sm">
                <GraduationCap size={26} />
              </div>

              <div>
                <p className="text-2xl font-bold tracking-tight text-[#0b3f30]">
                  Darasa-AI
                </p>

                <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-[#8b6b22]">
                  Adaptive Learning & Assessment
                </p>
              </div>
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#8b6b22]">
              School Administration
            </p>

            <h2 className="text-4xl font-bold tracking-tight text-[#12372d]">
              Welcome back
            </h2>

            <p className="mt-3 text-base leading-7 text-slate-500">
              Sign in to securely access your school dashboard, learners,
              assessments, and educational data.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold text-[#29453c]"
              >
                Username
              </label>

              <div className="relative">
                <UserRound
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="Enter your username"
                  required
                  className="w-full rounded-xl border border-[#d8ddd5] bg-white px-4 py-3.5 pl-11 text-[#17372d] outline-none transition placeholder:text-slate-400 focus:border-[#0b5d43] focus:ring-4 focus:ring-[#0b5d43]/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-[#29453c]"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-[#d8ddd5] bg-white px-4 py-3.5 pl-11 text-[#17372d] outline-none transition placeholder:text-slate-400 focus:border-[#0b5d43] focus:ring-4 focus:ring-[#0b5d43]/10"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#0b5d43] px-5 py-3.5 font-semibold text-white shadow-lg shadow-[#0b5d43]/15 transition hover:bg-[#084936] focus:outline-none focus:ring-4 focus:ring-[#0b5d43]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </span>

              {!isSubmitting && (
                <ArrowRight
                  size={19}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>
          </form>

          <div className="mt-9 border-t border-[#dddcd3] pt-6">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={21}
                className="mt-0.5 shrink-0 text-[#0b5d43]"
              />

              <div>
                <p className="text-sm font-semibold text-[#29453c]">
                  Secure education platform
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Your school data is protected through authenticated access
                  and school-level data isolation.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} Darasa-AI
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;