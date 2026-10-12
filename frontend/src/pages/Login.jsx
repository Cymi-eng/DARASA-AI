
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const loginSlideshowImages = [
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1800&q=85",
  "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1800&q=85",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1800&q=85",
];

function getRoleRedirect(role) {
  switch (role) {
    case "TEACHER":
      return "/teacher-portal";
    case "BURSAR":
      return "/finance";
    case "STUDENT":
      return "/student-portal";
    case "PARENT":
      return "/parent-portal";
    case "PLATFORM_ADMIN":
      return "/platform-admin";
    default:
      return "/dashboard";
  }
}

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [failedImages, setFailedImages] = useState([]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide(
        (current) => (current + 1) % loginSlideshowImages.length
      );
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      // Keep the existing authentication argument format.
      const user = await login({
        username: username.trim(),
        password,
        rememberMe,
      });

      const role =
        user?.role ||
        user?.profile?.role ||
        user?.user?.role ||
        "";

      navigate(getRoleRedirect(role), { replace: true });
    } catch (err) {
      const responseMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.non_field_errors?.[0] ||
        err?.message;

      setError(
        responseMessage ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageError = (image) => {
    setFailedImages((current) =>
      current.includes(image) ? current : [...current, image]
    );
  };

  return (
    <div className="min-h-screen bg-white lg:flex">
      {/* LEFT PANEL: CLASSROOM BACKGROUND AND FADING SLIDESHOW */}
      <section className="relative hidden min-h-screen overflow-hidden bg-emerald-950 lg:block lg:w-[56%]">
        {/* Permanent background image */}
        <img
          src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1800&q=85"
          alt=""
          aria-hidden="true"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Fading slideshow images */}
        {loginSlideshowImages.map((image, index) => (
          <img
            key={image}
            src={image}
            alt=""
            aria-hidden="true"
            onError={() => handleImageError(image)}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[1500ms] ease-in-out ${
              activeSlide === index &&
              !failedImages.includes(image)
                ? "opacity-100"
                : "opacity-0"
            }`}
          />
        ))}

        {/* Lighter green overlay: images remain visible */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/55 via-emerald-900/40 to-green-950/55" />

        {/* Decorative light effects */}
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-yellow-400/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 h-[30rem] w-[30rem] rounded-full bg-emerald-400/20 blur-3xl" />

        {/* LEFT CONTENT */}
        <div className="relative z-10 flex min-h-screen flex-col justify-between p-10 xl:p-14">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-emerald-950 shadow-xl">
              <BookOpenCheck size={30} strokeWidth={2.4} />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                DARASA<span className="text-yellow-400">-AI</span>
              </h1>
              <p className="mt-1 text-sm font-medium tracking-wide text-white">
                Adaptive Learning | Continuous Assessment | Better Futures
              </p>
            </div>
          </div>

          {/* Main message */}
          <div className="max-w-2xl py-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-yellow-300 backdrop-blur-sm">
              <GraduationCap size={18} />
              KENYA EDUCATION SECTOR
            </div>

            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-yellow-300">
              Empowering Kenya&apos;s CBC Journey
            </p>

            <h2 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-6xl">
              Every Child Learns.
              <br />
              Every Competency{" "}
              <span className="text-yellow-400">Counts.</span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-white xl:text-lg">
              Darasa-AI is Kenya&apos;s adaptive learning platform, built for
              CBC education. We support schools with personalized learning,
              continuous assessment, and data-driven insights for better
              outcomes.
            </p>

            {/* Features */}
            <div className="mt-10 grid grid-cols-2 gap-4 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/25 text-yellow-300">
                  <BookOpenCheck size={22} />
                </div>
                <h3 className="font-bold text-white">Personalized</h3>
                <p className="mt-1 text-sm text-white">Learning</p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/25 text-yellow-300">
                  <BarChart3 size={22} />
                </div>
                <h3 className="font-bold text-white">Continuous</h3>
                <p className="mt-1 text-sm text-white">Assessment</p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/25 text-yellow-300">
                  <GraduationCap size={22} />
                </div>
                <h3 className="font-bold text-white">Actionable</h3>
                <p className="mt-1 text-sm text-white">Insights</p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/25 text-yellow-300">
                  <UsersRound size={22} />
                </div>
                <h3 className="font-bold text-white">Stronger</h3>
                <p className="mt-1 text-sm text-white">Communities</p>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-white/20 bg-black/15 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400 text-emerald-950">
                <GraduationCap size={23} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-yellow-300">
                  CBC Ready
                </p>
                <p className="text-sm font-medium text-white">
                  Competency Based Curriculum
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/25 pt-6 text-sm text-white">
            <p>© {new Date().getFullYear()} DARASA-AI</p>
            <p>Every learner. Every competency. A better future.</p>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL: LOGIN FORM */}
      <section className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-5 py-10 sm:px-8 lg:w-[44%] lg:bg-white lg:px-10 xl:px-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-yellow-300 shadow-lg">
              <BookOpenCheck size={26} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-emerald-950">
                DARASA<span className="text-emerald-600">-AI</span>
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Adaptive Learning | Better Futures
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <LockKeyhole size={27} />
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome Back
            </h2>

            <p className="mt-3 leading-6 text-slate-500">
              Sign in to access your school dashboard and manage your
              learners, assessments, and school data.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your username"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                />
              </div>
            </div>

            {/* Password */}
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-emerald-700"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Remember me and forgot password */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-700 focus:ring-emerald-600"
                />
                Remember me
              </label>

              <button
                type="button"
                onClick={() =>
                  setError(
                    "Please contact your school or system administrator to reset your password."
                  )
                }
                className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-900"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-700 px-5 py-4 font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}

              {!isSubmitting && (
                <ArrowRight
                  size={19}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>
          </form>

          {/* Security and CBC information */}
          <div className="mt-8 space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <LockKeyhole size={19} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Secure &amp; Trusted
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Protected school data and secure account access.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-700">
                <GraduationCap size={20} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800">CBC Ready</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Competency-based learning and continuous assessment.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            © {new Date().getFullYear()} DARASA-AI. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Login;
