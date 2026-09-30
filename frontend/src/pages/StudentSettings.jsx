import {
  useEffect,
  useState,
} from "react";

import {
  Bell,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Moon,
  Save,
  ShieldCheck,
  User,
  UserRound,
  Zap,
} from "lucide-react";

import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getStudentSettings,
  saveStudentSettings,
} from "../theme.js";


const DEFAULT_PREFERENCES = {
  darkMode: false,
  compactMode: false,
  reduceAnimations: false,
  showNotifications: true,
};


function getErrorMessage(
  error,
  fallback
) {
  const data = error?.response?.data;

  if (!data) {
    return (
      error?.message ||
      fallback
    );
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  const messages = [];

  Object.entries(data).forEach(
    ([field, value]) => {
      const values = Array.isArray(value)
        ? value
        : [value];

      values.forEach((message) => {
        if (
          typeof message === "string"
        ) {
          messages.push(
            field ===
            "non_field_errors"
              ? message
              : `${field.replaceAll(
                  "_",
                  " "
                )}: ${message}`
          );
        }
      });
    }
  );

  return messages.length
    ? messages.join(" ")
    : fallback;
}


function getInitials(user) {
  const first =
    user?.first_name?.trim() || "";

  const last =
    user?.last_name?.trim() || "";

  if (first || last) {
    return `${first.charAt(
      0
    )}${last.charAt(0)}`.toUpperCase();
  }

  return (
    user?.username
      ?.slice(0, 2)
      .toUpperCase() || "ST"
  );
}


function StudentSettings() {
  const {
    user,
    logout,
  } = useAuth();

  const [
    username,
    setUsername,
  ] = useState(
    user?.username || ""
  );

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    preferences,
    setPreferences,
  ] = useState({
    ...DEFAULT_PREFERENCES,
    ...getStudentSettings(),
  });

  const [
    savingAccount,
    setSavingAccount,
  ] = useState(false);

  const [
    savingPreferences,
    setSavingPreferences,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  useEffect(() => {
    setUsername(
      user?.username || ""
    );
  }, [user]);

  useEffect(() => {
    const handleSettingsChange = (
      event
    ) => {
      if (event.detail) {
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...event.detail,
        });
      }
    };

    window.addEventListener(
      "darasa-settings-changed",
      handleSettingsChange
    );

    return () => {
      window.removeEventListener(
        "darasa-settings-changed",
        handleSettingsChange
      );
    };
  }, []);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function updatePreference(
    field,
    value
  ) {
    clearMessages();

    setPreferences(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  async function handleAccountSubmit(
    event
  ) {
    event.preventDefault();

    clearMessages();

    const trimmedUsername =
      username.trim();

    if (!trimmedUsername) {
      setError(
        "Username cannot be empty."
      );
      return;
    }

    const changingPassword =
      Boolean(newPassword);

    if (
      changingPassword &&
      !currentPassword
    ) {
      setError(
        "Enter your current password to change your password."
      );
      return;
    }

    if (
      changingPassword &&
      newPassword !== confirmPassword
    ) {
      setError(
        "The new passwords do not match."
      );
      return;
    }

    if (
      changingPassword &&
      newPassword.length < 8
    ) {
      setError(
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    const usernameChanged =
      trimmedUsername !==
      (user?.username || "");

    if (
      !usernameChanged &&
      !changingPassword
    ) {
      setError(
        "There are no account changes to save."
      );
      return;
    }

    const payload = {};

    if (usernameChanged) {
      payload.username =
        trimmedUsername;
    }

    if (changingPassword) {
      payload.current_password =
        currentPassword;

      payload.new_password =
        newPassword;
    }

    setSavingAccount(true);

    try {
      const response =
        await api.post(
          "/users/me/settings/",
          payload
        );

      const updatedUser =
        response.data;

      setUsername(
        updatedUser?.username ||
          trimmedUsername
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccess(
        changingPassword
          ? "Your account and password were updated successfully."
          : "Your username was updated successfully."
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to update your account settings."
        )
      );
    } finally {
      setSavingAccount(false);
    }
  }

  function savePreferences() {
    clearMessages();

    setSavingPreferences(true);

    try {
      saveStudentSettings(
        preferences
      );

      setSuccess(
        "Your preferences were saved."
      );
    } finally {
      setSavingPreferences(false);
    }
  }

  function handleSignOut() {
    logout();
  }

  return (
    <section
      className={[
        "mx-auto w-full max-w-5xl space-y-6",
        preferences.compactMode
          ? "student-settings-compact"
          : "",
      ].join(" ")}
    >
      {/* HEADER */}

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0B5D43] dark:text-emerald-400">
          Account
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-[#17382E] dark:text-white sm:text-4xl">
          Settings
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#70807A] dark:text-slate-400">
          Manage your account, security and
          student workspace preferences.
        </p>
      </div>

      {/* MESSAGES */}

      {error && (
        <div className="rounded-xl border border-[#F1C8C3] bg-[#FFF4F2] px-4 py-3 text-sm text-[#A33A32] dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-[#CFE4D8] bg-[#F0F8F3] px-4 py-3 text-sm text-[#0B5D43] dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Check size={17} />
          {success}
        </div>
      )}

      {/* PROFILE */}

      <div className="rounded-2xl border border-[#E4E5DE] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3EE] text-lg font-bold text-[#0B5D43] dark:bg-emerald-950 dark:text-emerald-300">
            {getInitials(user)}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#87948E] dark:text-slate-500">
              Student account
            </p>

            <h2 className="mt-1 truncate text-xl font-bold text-[#17382E] dark:text-white">
              {user?.first_name ||
              user?.last_name
                ? `${user?.first_name || ""} ${
                    user?.last_name || ""
                  }`.trim()
                : user?.username ||
                  "Student"}
            </h2>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-lg bg-[#EAF3EE] px-2.5 py-1 text-xs font-semibold text-[#0B5D43] dark:bg-emerald-950 dark:text-emerald-300">
                Student
              </span>

              {user?.school?.name && (
                <span className="rounded-lg bg-[#F3F4EF] px-2.5 py-1 text-xs font-medium text-[#63716C] dark:bg-slate-800 dark:text-slate-400">
                  {user.school.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ACCOUNT SECURITY */}

      <form
        onSubmit={handleAccountSubmit}
        className="rounded-2xl border border-[#E4E5DE] bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="border-b border-[#ECEDE8] p-5 dark:border-slate-800 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43] dark:bg-emerald-950 dark:text-emerald-300">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-[#17382E] dark:text-white">
                Account & Security
              </h2>

              <p className="mt-1 text-sm text-[#82908C] dark:text-slate-400">
                Update your username or password.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {/* USERNAME */}

          <div>
            <label
              htmlFor="student-username"
              className="mb-2 block text-xs font-semibold text-[#52635D] dark:text-slate-300"
            >
              Username
            </label>

            <div className="relative">
              <User
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA49F] dark:text-slate-500"
              />

              <input
                id="student-username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                autoComplete="username"
                className="w-full rounded-xl border border-[#DDE1DB] bg-white py-3 pl-10 pr-4 text-sm text-[#17382E] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-500"
              />
            </div>

            <p className="mt-1.5 text-[11px] text-[#8A9691] dark:text-slate-500">
              This is the username you use to sign
              in.
            </p>
          </div>

          {/* PASSWORD */}

          <div className="border-t border-[#ECEDE8] pt-6 dark:border-slate-800">
            <div className="mb-4 flex items-center gap-2">
              <KeyRound
                size={17}
                className="text-[#0B5D43] dark:text-emerald-400"
              />

              <h3 className="text-sm font-bold text-[#17382E] dark:text-white">
                Change password
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* CURRENT */}

              <div>
                <label
                  htmlFor="current-password"
                  className="mb-2 block text-xs font-semibold text-[#52635D] dark:text-slate-300"
                >
                  Current password
                </label>

                <div className="relative">
                  <input
                    id="current-password"
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(
                        event.target.value
                      )
                    }
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-[#DDE1DB] bg-white py-3 pl-3.5 pr-11 text-sm text-[#17382E] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#89958F] hover:bg-[#F3F4EF] dark:text-slate-500 dark:hover:bg-slate-800"
                    aria-label={
                      showCurrentPassword
                        ? "Hide current password"
                        : "Show current password"
                    }
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {/* NEW */}

              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-xs font-semibold text-[#52635D] dark:text-slate-300"
                >
                  New password
                </label>

                <div className="relative">
                  <input
                    id="new-password"
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value
                      )
                    }
                    autoComplete="new-password"
                    minLength={8}
                    className="w-full rounded-xl border border-[#DDE1DB] bg-white py-3 pl-3.5 pr-11 text-sm text-[#17382E] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#89958F] hover:bg-[#F3F4EF] dark:text-slate-500 dark:hover:bg-slate-800"
                    aria-label={
                      showNewPassword
                        ? "Hide new password"
                        : "Show new password"
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {/* CONFIRM */}

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-xs font-semibold text-[#52635D] dark:text-slate-300"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    id="confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-[#DDE1DB] bg-white py-3 pl-3.5 pr-11 text-sm text-[#17382E] outline-none transition focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#89958F] hover:bg-[#F3F4EF] dark:text-slate-500 dark:hover:bg-slate-800"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmation password"
                        : "Show confirmation password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-[#8A9691] dark:text-slate-500">
              Passwords must be at least 8 characters
              and should not be easy to guess.
            </p>
          </div>

          <div className="flex justify-end border-t border-[#ECEDE8] pt-5 dark:border-slate-800">
            <button
              type="submit"
              disabled={savingAccount}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#084936] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {savingAccount ? (
                "Saving..."
              ) : (
                <>
                  <Save size={17} />
                  Save account changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* APPEARANCE */}

      <div className="rounded-2xl border border-[#E4E5DE] bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-[#ECEDE8] p-5 dark:border-slate-800 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F2F5] text-[#52635D] dark:bg-slate-800 dark:text-slate-300">
              <Moon size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-[#17382E] dark:text-white">
                Appearance
              </h2>

              <p className="mt-1 text-sm text-[#82908C] dark:text-slate-400">
                Personalise how your student workspace
                looks and behaves.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#ECEDE8] dark:divide-slate-800">
          {/* DARK MODE */}

          <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Moon
                size={18}
                className="mt-0.5 text-[#6D7B75] dark:text-slate-400"
              />

              <div>
                <p className="text-sm font-semibold text-[#405650] dark:text-slate-200">
                  Dark mode
                </p>

                <p className="mt-1 text-xs leading-5 text-[#82908C] dark:text-slate-500">
                  Use a darker interface for comfortable
                  viewing at night.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                updatePreference(
                  "darkMode",
                  !preferences.darkMode
                )
              }
              className={[
                "relative h-6 w-11 shrink-0 rounded-full transition",
                preferences.darkMode
                  ? "bg-[#0B5D43]"
                  : "bg-[#CBD2CE]",
              ].join(" ")}
              aria-pressed={
                preferences.darkMode
              }
              aria-label="Toggle dark mode"
            >
              <span
                className={[
                  "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
                  preferences.darkMode
                    ? "left-6"
                    : "left-1",
                ].join(" ")}
              />
            </button>
          </div>

          {/* COMPACT */}

          <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Zap
                size={18}
                className="mt-0.5 text-[#6D7B75] dark:text-slate-400"
              />

              <div>
                <p className="text-sm font-semibold text-[#405650] dark:text-slate-200">
                  Compact workspace
                </p>

                <p className="mt-1 text-xs leading-5 text-[#82908C] dark:text-slate-500">
                  Reduce spacing to fit more information
                  on screen.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                updatePreference(
                  "compactMode",
                  !preferences.compactMode
                )
              }
              className={[
                "relative h-6 w-11 shrink-0 rounded-full transition",
                preferences.compactMode
                  ? "bg-[#0B5D43]"
                  : "bg-[#CBD2CE]",
              ].join(" ")}
              aria-pressed={
                preferences.compactMode
              }
              aria-label="Toggle compact workspace"
            >
              <span
                className={[
                  "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
                  preferences.compactMode
                    ? "left-6"
                    : "left-1",
                ].join(" ")}
              />
            </button>
          </div>

          {/* REDUCE MOTION */}

          <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Zap
                size={18}
                className="mt-0.5 text-[#6D7B75] dark:text-slate-400"
              />

              <div>
                <p className="text-sm font-semibold text-[#405650] dark:text-slate-200">
                  Reduce animations
                </p>

                <p className="mt-1 text-xs leading-5 text-[#82908C] dark:text-slate-500">
                  Minimise interface transitions and motion.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                updatePreference(
                  "reduceAnimations",
                  !preferences.reduceAnimations
                )
              }
              className={[
                "relative h-6 w-11 shrink-0 rounded-full transition",
                preferences.reduceAnimations
                  ? "bg-[#0B5D43]"
                  : "bg-[#CBD2CE]",
              ].join(" ")}
              aria-pressed={
                preferences.reduceAnimations
              }
              aria-label="Toggle reduced animations"
            >
              <span
                className={[
                  "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
                  preferences.reduceAnimations
                    ? "left-6"
                    : "left-1",
                ].join(" ")}
              />
            </button>
          </div>

          <div className="flex justify-end p-5 sm:p-6">
            <button
              type="button"
              onClick={savePreferences}
              disabled={savingPreferences}
              className="inline-flex items-center gap-2 rounded-xl bg-[#17382E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B5D43] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              {savingPreferences ? (
                "Saving..."
              ) : (
                <>
                  <Save size={17} />
                  Save preferences
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS */}

      <div className="rounded-2xl border border-[#E4E5DE] bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-[#ECEDE8] p-5 dark:border-slate-800 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7DF] text-[#9A7600] dark:bg-amber-950 dark:text-amber-300">
              <Bell size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-[#17382E] dark:text-white">
                Notifications
              </h2>

              <p className="mt-1 text-sm text-[#82908C] dark:text-slate-400">
                Choose how notifications appear in your
                workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Bell
              size={18}
              className="mt-0.5 text-[#6D7B75] dark:text-slate-400"
            />

            <div>
              <p className="text-sm font-semibold text-[#405650] dark:text-slate-200">
                Show notifications
              </p>

              <p className="mt-1 text-xs leading-5 text-[#82908C] dark:text-slate-500">
                Keep notification indicators visible in
                your student workspace.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              updatePreference(
                "showNotifications",
                !preferences.showNotifications
              )
            }
            className={[
              "relative h-6 w-11 shrink-0 rounded-full transition",
              preferences.showNotifications
                ? "bg-[#0B5D43]"
                : "bg-[#CBD2CE]",
            ].join(" ")}
            aria-pressed={
              preferences.showNotifications
            }
            aria-label="Toggle notifications"
          >
            <span
              className={[
                "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
                preferences.showNotifications
                  ? "left-6"
                  : "left-1",
              ].join(" ")}
            />
          </button>
        </div>
      </div>

      {/* SECURITY STATUS */}

      <div className="rounded-2xl border border-[#CFE4D8] bg-[#F0F8F3] p-5 dark:border-emerald-900 dark:bg-emerald-950/30 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0B5D43] dark:bg-emerald-950 dark:text-emerald-300">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-[#17382E] dark:text-emerald-200">
              Account security
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#63766D] dark:text-slate-400">
              Your password is protected by Django's
              password hashing system. Changing your
              password requires your current password.
            </p>
          </div>
        </div>
      </div>

      {/* SIGN OUT */}

      <div className="rounded-2xl border border-[#F0D8D4] bg-white p-5 shadow-sm dark:border-red-900 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0EE] text-[#B33A31] dark:bg-red-950 dark:text-red-300">
              <LogOut size={19} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#17382E] dark:text-white">
                Sign out
              </h2>

              <p className="mt-1 text-xs leading-5 text-[#82908C] dark:text-slate-500">
                Sign out of your Darasa-AI student
                account on this device.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5C4BF] px-5 py-2.5 text-sm font-semibold text-[#A33A32] transition hover:bg-[#FFF4F2] dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </div>

      {/* FOOTER */}

      <div className="flex items-center justify-center gap-2 pb-6 text-[11px] text-[#9BA5A1] dark:text-slate-600">
        <UserRound size={13} />
        Darasa-AI Student Workspace
      </div>
    </section>
  );
}

export default StudentSettings;