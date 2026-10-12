
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

// Education images for the fading login slideshow.
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

  // Slideshow state.
  const [activeSlide, setActiveSlide] = useState(0);

  // Fade to the next education image every six seconds.
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

  return (
    <div className="min-h-screen bg-white lg:flex">
      {/* ======================================================
          LEFT PANEL: PERMANENT BACKGROUND + FADING SLIDESHOW
      ======================================================= */}
      <section className="relative hidden min-h-screen overflow-hidden lg:block lg:w-[56%]">
        {/* Permanent classroom background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://mogotiolittlefriends.sc.ke/assets/images/school/Class_2.jpg')",
          }}
        />

        {/* Automatically fading education images */}
        {loginSlideshowImages.map((image, index) => (
          <div
            key={image}
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out"
            style={{
              backgroundImage: `url("${image}")`,
              opacity: activeSlide === index ? 0.48 : 0,
            }}
          />
        ))}

        {/* Green overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-emerald-900/75 to-green-950/85" />

        {/* Gold and green decorative overlays */}
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-yellow-400/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 h-[30rem] w-[30rem] rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white/10 to-transparent" />

        {/* Left panel content */}
        <div className="relative z-10 flex min-h-screen flex-col justify-between p-10 xl:p-14">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-emerald-950 shadow-xl shadow-black/20">
              <BookOpenCheck size={30} strokeWidth={2.4} />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                DARASA<span className="text-yellow-400">-AI</span>
              </h1>
              <p className="mt-1 text-sm font-medium tracking-wide text-emerald-100">
                Smart Learning. Better Outcomes.
              </p>
            </div>
          </div>

          {/* Hero content */}
          <div className="max-w-2xl py-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-yellow-300 backdrop-blur-sm">
              <GraduationCap size={18} />
              <span>Built for CBC Education</span>
            </div>

            <h2 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-6xl">
              Empowering every learner to{" "}
              <span className="text-yellow-400">reach their potential.</span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-emerald-50/90 xl:text-lg">
              A smarter way to manage learning, monitor competency mastery,
              and support teachers with meaningful insights into every
              learner&apos;s progress.
            </p>

            {/* Feature cards */}
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/20 text-yellow-300">
                  <BookOpenCheck size={22} />
                </div>
                <h3 className="font-bold text-white">CBC Learning</h3>
                <p className="mt-2 text-sm leading-6 text-emerald-100">
                  Competency-focused learning and assessment.
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/20 text-yellow-300">
                  <BarChart3 size={22} />
                </div>
                <h3 className="font-bold text-white">Progress Insights</h3>
                <p className="mt-2 text-sm leading-6 text-emerald-100">
                  Track mastery and identify learning gaps.
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/20 text-yellow-300">
                  <UsersRound size={22} />
                </div>
                <h3 className="font-bold text-white">Connected Schools</h3>
                <p className="mt-2 text-sm leading-6 text-emerald-100">
                  Support teachers, learners, and school leaders.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-6 text-sm text-emerald-100/80">
            <p>© {new Date().getFullYear()} DARASA-AI</p>
            <p>Advancing education through technology.</p>
          </div>
        </div>

        {/* Decorative transition on the right edge */}
        <div className="pointer-events-none absolute right-0 top-0 z-20 h-full w-10 bg-gradient-to-l from-white/15 to-transparent" />
      </section>

      {/* ======================================================
          RIGHT PANEL: LOGIN FORM
      ======================================================= */}
      <section className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-5 py-10 sm:px-8 lg:w-[44%] lg:bg-white lg:px-10 xl:px-16">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-yellow-300 shadow-lg">
              <BookOpenCheck size={26} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-emerald-950">
                DARASA<span className="text-emerald-600">-AI</span>
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Smart Learning. Better Outcomes.
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <LockKeyhole size={27} />
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back
            </h2>

            <p className="mt-3 leading-6 text-slate-500">
              Sign in to your DARASA-AI account to continue.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {error}
            </div>
          )}

          {/* Login form */}
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

            {/* Remember me */}
            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-700 focus:ring-emerald-600"
                />
                Remember me
              </label>
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

          {/* Access information */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <LockKeyhole size={18} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Secure school access
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Use the login credentials provided by your school or
                  system administrator. Accounts are managed by authorized
                  administrators.
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
