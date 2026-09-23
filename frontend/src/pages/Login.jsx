import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  UsersRound,
  UserRound,
} from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";

function Login() {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      await login(username, password);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to sign in. Please verify your username and password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f7f2]">
      <div className="flex min-h-screen flex-col lg:flex-row">

        {/* =========================================================
            LEFT PANEL
        ========================================================== */}
        <section className="relative hidden min-h-screen overflow-hidden lg:block lg:w-[56%]">

          {/* Classroom image */}
          <div
  className="absolute inset-0 bg-cover bg-center"
  style={{
    backgroundImage:
      "url('https://mogotiolittlefriends.sc.ke/assets/images/school/Class_2.jpg')",
  }}
/>

          {/* Main green image overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#07382a]/45 via-[#07382a]/35 to-[#03251b]/95" />

          {/* Bottom dark fade */}
          <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-[#03251b] via-[#03251b]/85 to-transparent" />

          {/* Subtle left-to-right fade */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#03251b]/25 via-transparent to-[#03251b]/10" />

          {/* Decorative green/gold curves */}
          <div className="absolute -bottom-32 -left-20 h-72 w-[85%] rotate-[7deg] rounded-[50%] border-[28px] border-[#1d6b48]/80" />

          <div className="absolute -bottom-40 left-[-8%] h-64 w-[82%] rotate-[7deg] rounded-[50%] border-[10px] border-[#efbd43]/95" />

          {/* Diagonal white transition */}
          <div
            className="absolute right-[-2px] top-0 z-20 h-full w-[145px] bg-[#f8f7f2]"
            style={{
              clipPath:
                "polygon(100% 0, 100% 100%, 0 100%, 68% 50%)",
            }}
          />

          {/* Left content */}
          <div className="relative z-10 flex min-h-screen flex-col px-10 py-10 xl:px-[4.5rem] xl:py-12">

            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="flex h-[62px] w-[62px] items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm">
                <GraduationCap size={38} strokeWidth={1.8} />
              </div>

              <div>
                <h1 className="text-[2.7rem] font-bold leading-none tracking-tight text-white">
                  Darasa-AI
                </h1>

                <p className="mt-2 text-sm font-medium text-white/80">
                  Adaptive Learning
                  <span className="mx-2">|</span>
                  Continuous Assessment
                  <span className="mx-2">|</span>
                  Better Futures
                </p>
              </div>
            </div>

            {/* Hero */}
            <div className="mt-auto max-w-[760px] pb-24 xl:pb-28">

              <p className="mb-5 text-[15px] font-semibold uppercase tracking-[0.22em] text-[#efc34d]">
                Empowering Kenya's CBC Journey
              </p>

              <h2 className="text-[3.3rem] font-bold leading-[1.08] tracking-tight text-white xl:text-[4rem]">
                Every Child Learns.
                <br />
                Every{" "}
                <span className="text-[#f1c54c]">
                  Competency
                </span>{" "}
                Counts.
              </h2>

              <p className="mt-6 max-w-[690px] text-[17px] leading-8 text-white/90">
                Darasa-AI is Kenya's adaptive learning platform, built for
                CBC education. We support schools with personalized learning,
                continuous assessment and data-driven insights for better
                outcomes.
              </p>

              {/* Feature strip */}
              <div className="mt-10 flex items-start gap-7">

                <div className="flex items-center gap-3">
                  <UsersRound
                    size={31}
                    strokeWidth={1.6}
                    className="text-[#f1c54c]"
                  />

                  <div>
                    <p className="text-sm font-medium text-white">
                      Personalized
                    </p>
                    <p className="text-sm text-white">
                      Learning
                    </p>
                  </div>
                </div>

                <div className="h-12 w-px bg-[#d8b449]/70" />

                <div className="flex items-center gap-3">
                  <BookOpenCheck
                    size={31}
                    strokeWidth={1.6}
                    className="text-[#f1c54c]"
                  />

                  <div>
                    <p className="text-sm font-medium text-white">
                      Continuous
                    </p>
                    <p className="text-sm text-white">
                      Assessment
                    </p>
                  </div>
                </div>

                <div className="h-12 w-px bg-[#d8b449]/70" />

                <div className="flex items-center gap-3">
                  <BarChart3
                    size={31}
                    strokeWidth={1.6}
                    className="text-[#f1c54c]"
                  />

                  <div>
                    <p className="text-sm font-medium text-white">
                      Actionable
                    </p>
                    <p className="text-sm text-white">
                      Insights
                    </p>
                  </div>
                </div>

                <div className="h-12 w-px bg-[#d8b449]/70" />

                <div className="flex items-center gap-3">
                  <UsersRound
                    size={31}
                    strokeWidth={1.6}
                    className="text-[#f1c54c]"
                  />

                  <div>
                    <p className="text-sm font-medium text-white">
                      Stronger
                    </p>
                    <p className="text-sm text-white">
                      Communities
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            RIGHT PANEL
        ========================================================== */}
        <section className="relative flex min-h-screen w-full items-center bg-[#f8f7f2] px-6 py-10 lg:w-[44%] lg:px-12 xl:px-16">

          {/* Decorative corner */}
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 overflow-hidden opacity-30">
            <div className="absolute right-[-60px] top-[-60px] h-44 w-44 rotate-45 border-[18px] border-[#e9e6dc]" />
            <div className="absolute right-[-20px] top-[-20px] h-28 w-28 rotate-45 border-[12px] border-[#e9e6dc]" />
          </div>

          <div className="mx-auto w-full max-w-[520px]">

            {/* Top institutional area */}
            <div className="mb-14 flex items-center justify-end">
              <div className="border-r border-[#0b5d43] pr-4 text-right">
                <p className="text-[12px] font-semibold tracking-wide text-[#17382e]">
                  KENYA EDUCATION SECTOR
                </p>

                <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-slate-500">
                  Competency Based Curriculum
                </p>
              </div>

              <div className="ml-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#d9d7cd] text-[#0b5d43]">
                <BookOpenCheck size={25} />
              </div>
            </div>

            {/* Darasa-AI branding */}
            <div className="mb-12 flex items-center gap-4">
              <div className="flex h-[64px] w-[64px] items-center justify-center rounded-xl bg-[#0b5d43] text-white">
                <GraduationCap size={38} strokeWidth={1.7} />
              </div>

              <div>
                <h3 className="text-[2.7rem] font-bold leading-none tracking-tight text-[#0b4d39]">
                  Darasa-AI
                </h3>

                <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0b4d39]">
                  Adaptive Learning & Assessment Platform
                </p>
              </div>
            </div>

            {/* Welcome */}
            <div className="mb-9">
              <h4 className="text-[2.25rem] font-bold tracking-tight text-[#0c5b43]">
                Welcome Back
              </h4>

              <p className="mt-3 max-w-[470px] text-[16px] leading-7 text-[#71817d]">
                Sign in to access your school dashboard and manage your
                learners, assessments and school data.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Username */}
              <div className="relative">
                <UserRound
                  size={23}
                  strokeWidth={1.8}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7b8985]"
                />

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  autoComplete="username"
                  placeholder="Username"
                  required
                  className="h-[62px] w-full rounded-xl border border-[#d7dad7] bg-white px-5 pl-16 text-[16px] text-[#17382e] shadow-sm outline-none transition placeholder:text-[#899692] focus:border-[#0b5d43] focus:ring-4 focus:ring-[#0b5d43]/10"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <LockKeyhole
                  size={23}
                  strokeWidth={1.8}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-[#7b8985]"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  placeholder="Password"
                  required
                  className="h-[62px] w-full rounded-xl border border-[#d7dad7] bg-white px-14 pl-16 text-[16px] text-[#17382e] shadow-sm outline-none transition placeholder:text-[#899692] focus:border-[#0b5d43] focus:ring-4 focus:ring-[#0b5d43]/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[#71817d] transition hover:text-[#0b5d43]"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={22} />
                  ) : (
                    <Eye size={22} />
                  )}
                </button>
              </div>

              {/* Remember / forgot */}
              <div className="flex items-center justify-between pt-1">

                <label className="flex cursor-pointer items-center gap-3 text-sm text-[#60716c]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(event.target.checked)
                    }
                    className="h-5 w-5 rounded border-[#aeb8b4] accent-[#0b5d43]"
                  />

                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="text-sm font-medium text-[#0b5d43] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex h-[60px] w-full items-center justify-center gap-4 rounded-xl bg-[#0b5d43] text-[18px] font-semibold text-white shadow-lg shadow-[#0b5d43]/20 transition hover:bg-[#084936] focus:outline-none focus:ring-4 focus:ring-[#0b5d43]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span>
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </span>

                {!isSubmitting && (
                  <ArrowRight
                    size={23}
                    className="transition-transform group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            {/* Bottom information */}
            <div className="mt-14 border-t border-[#deddd5] pt-7">
              <div className="grid grid-cols-2 gap-8">

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0b5d43]/10 text-[#0b5d43]">
                    <LockKeyhole size={18} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#405650]">
                      Secure & Trusted
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-[#82908c]">
                      Protected school data
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0b5d43]/10 text-[#0b5d43]">
                    <BookOpenCheck size={18} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#405650]">
                      CBC Ready
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-[#82908c]">
                      Competency-based learning
                    </p>
                  </div>
                </div>

              </div>

              <p className="mt-9 text-center text-[11px] text-[#9ba5a1]">
                © {new Date().getFullYear()} Darasa-AI
              </p>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;