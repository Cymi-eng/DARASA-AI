import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Lock, User } from "lucide-react";

import api from "../api";
import { saveTokens } from "../auth";

export default function TeacherLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/token/", {
        username: form.username.trim(),
        password: form.password,
      });

      saveTokens(
        response.data.access,
        response.data.refresh
      );

      const profileResponse = await api.get("/users/me/");
      const user = profileResponse.data;

      if (user.role !== "TEACHER") {
        localStorage.removeItem("darasa_access_token");
        localStorage.removeItem("darasa_refresh_token");

        setError(
          "This account is not registered as a teacher account."
        );

        return;
      }

      navigate("/teacher-portal", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Invalid teacher username or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f3e8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-green-900/10 overflow-hidden">
          <div className="bg-green-900 px-8 py-10 text-white text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <GraduationCap size={34} />
            </div>

            <h1 className="text-2xl font-bold">
              Teacher Portal
            </h1>

            <p className="mt-2 text-sm text-green-100">
              Sign in to manage your learners and assessments
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-8 space-y-5"
          >
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teacher username
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  placeholder="Enter your username"
                  className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-green-900 py-3.5 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in as teacher"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          DARASA-AI • Competency-Based Learning Platform
        </p>
      </div>
    </div>
  );
}