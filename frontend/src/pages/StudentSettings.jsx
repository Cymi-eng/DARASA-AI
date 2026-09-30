import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Moon,
  Palette,
  Save,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  X,
} from "lucide-react";

import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getStudentSettings,
  saveStudentSettings,
} from "../theme.js";

const INITIAL_FORM = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
};

const INITIAL_PASSWORDS = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

function StudentSettings() {
  const { user, logout } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [passwords, setPasswords] = useState(
    INITIAL_PASSWORDS
  );

  const [preferences, setPreferences] = useState(
    getStudentSettings()
  );

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] =
    useState(false);
  const [savingPassword, setSavingPassword] =
    useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [activeSection, setActiveSection] =
    useState("profile");

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const response = await api.get(
          "/users/me/settings/"
        );

        if (!mounted) {
          return;
        }

        setForm({
          username: response.data.username || "",
          first_name:
            response.data.first_name || "",
          last_name:
            response.data.last_name || "",
          email: response.data.email || "",
        });
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        setError(
          requestError.response?.data?.detail ||
            "Unable to load your account settings."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const displayName = useMemo(() => {
    const fullName = [
      form.first_name,
      form.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    return fullName || form.username || "Student";
  }, [
    form.first_name,
    form.last_name,
    form.username,
  ]);

  const initials = useMemo(() => {
    const parts = displayName
      .split(" ")
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }, [displayName]);

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage("");
    setError("");
  };

  const updatePassword = (field, value) => {
    setPasswords((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage("");
    setError("");
  };

  const updatePreference = (field, value) => {
    const updated = {
      ...preferences,
      [field]: value,
    };

    setPreferences(updated);
    saveStudentSettings(updated);
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    setSavingProfile(true);
    setMessage("");
    setError("");

    try {
      const response = await api.post(
        "/users/me/settings/",
        {
          username: form.username.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
        }
      );

      setForm((current) => ({
        ...current,
        username:
          response.data.username ||
          current.username,
        first_name:
          response.data.first_name ||
          current.first_name,
        last_name:
          response.data.last_name ||
          current.last_name,
        email:
          response.data.email ??
          current.email,
      }));

      setMessage(
        "Your profile information has been saved."
      );
    } catch (requestError) {
      const data = requestError.response?.data;

      setError(
        data?.username?.[0] ||
          data?.email?.[0] ||
          data?.detail ||
          "Unable to save your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    setSavingPassword(true);
    setMessage("");
    setError("");

    if (!passwords.current_password) {
      setError(
        "Enter your current password first."
      );
      setSavingPassword(false);
      return;
    }

    if (!passwords.new_password) {
      setError("Enter your new password.");
      setSavingPassword(false);
      return;
    }

    if (passwords.new_password.length < 8) {
      setError(
        "Your new password must contain at least 8 characters."
      );
      setSavingPassword(false);
      return;
    }

    if (
      passwords.new_password !==
      passwords.confirm_password
    ) {
      setError(
        "The new passwords do not match."
      );
      setSavingPassword(false);
      return;
    }

    try {
      const response = await api.post(
        "/users/me/settings/",
        {
          current_password:
            passwords.current_password,
          new_password:
            passwords.new_password,
          confirm_password:
            passwords.confirm_password,
        }
      );

      setPasswords(INITIAL_PASSWORDS);

      setMessage(
        response.data?.detail ||
          "Your password has been changed successfully."
      );
    } catch (requestError) {
      const data = requestError.response?.data;

      setError(
        data?.current_password?.[0] ||
          data?.new_password?.[0] ||
          data?.confirm_password?.[0] ||
          data?.detail ||
          "Unable to change your password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
          Loading your settings...
        </div>
      </div>
    );
  }

  return (
    <div className="student-settings-compact min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#087f5b] to-[#0f766e] p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-100">
                <Sparkles size={16} />
                Student account
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Settings
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/90 sm:text-base">
                Manage your profile, password and
                learning experience preferences.
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-lg font-bold text-emerald-800 shadow-sm">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {displayName}
                </p>

                <p className="truncate text-sm text-emerald-100">
                  @{form.username}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(message || error) && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {error ? (
              <X size={18} className="mt-0.5 shrink-0" />
            ) : (
              <Check
                size={18}
                className="mt-0.5 shrink-0"
              />
            )}

            <p>{error || message}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[230px_1fr]">

          {/* Navigation */}
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <SettingsNavItem
              active={activeSection === "profile"}
              icon={UserRound}
              label="Profile"
              description="Personal details"
              onClick={() =>
                setActiveSection("profile")
              }
            />

            <SettingsNavItem
              active={activeSection === "security"}
              icon={KeyRound}
              label="Security"
              description="Password & access"
              onClick={() =>
                setActiveSection("security")
              }
            />

            <SettingsNavItem
              active={activeSection === "appearance"}
              icon={Palette}
              label="Appearance"
              description="Theme & display"
              onClick={() =>
                setActiveSection("appearance")
              }
            />

            <SettingsNavItem
              active={activeSection === "notifications"}
              icon={Bell}
              label="Notifications"
              description="Stay informed"
              onClick={() =>
                setActiveSection("notifications")
              }
            />

            <div className="my-3 border-t border-slate-100" />

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-red-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <LogOut size={17} />
              </span>

              <span>
                <span className="block text-sm font-semibold text-red-700">
                  Sign out
                </span>

                <span className="block text-xs text-red-400">
                  End this session
                </span>
              </span>
            </button>
          </aside>

          {/* Content */}
          <main className="space-y-6">

            {/* Profile */}
            {activeSection === "profile" && (
              <SettingsCard
                icon={UserRound}
                title="Profile information"
                description="Keep your account information up to date."
              >
                <form
                  onSubmit={saveProfile}
                  className="space-y-5"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="First name"
                      value={form.first_name}
                      onChange={(value) =>
                        updateForm(
                          "first_name",
                          value
                        )
                      }
                    />

                    <Field
                      label="Last name"
                      value={form.last_name}
                      onChange={(value) =>
                        updateForm(
                          "last_name",
                          value
                        )
                      }
                    />
                  </div>

                  <Field
                    label="Username"
                    value={form.username}
                    onChange={(value) =>
                      updateForm(
                        "username",
                        value
                      )
                    }
                    prefix="@"
                  />

                  <Field
                    label="Email address"
                    type="email"
                    value={form.email}
                    onChange={(value) =>
                      updateForm(
                        "email",
                        value
                      )
                    }
                  />

                  <div className="flex justify-end border-t border-slate-100 pt-5">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save size={17} />

                      {savingProfile
                        ? "Saving..."
                        : "Save profile"}
                    </button>
                  </div>
                </form>
              </SettingsCard>
            )}

            {/* Security */}
            {activeSection === "security" && (
              <>
                <SettingsCard
                  icon={ShieldCheck}
                  title="Account security"
                  description="Change your password securely."
                >
                  <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex gap-3">
                      <ShieldCheck
                        size={20}
                        className="mt-0.5 shrink-0 text-emerald-700"
                      />

                      <div>
                        <p className="text-sm font-semibold text-emerald-900">
                          Your password is protected
                        </p>

                        <p className="mt-1 text-xs leading-5 text-emerald-700">
                          Your new password is hashed by
                          Django before it is stored in
                          the database.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={changePassword}
                    className="space-y-5"
                  >
                    <PasswordField
                      label="Current password"
                      value={
                        passwords.current_password
                      }
                      visible={
                        showCurrentPassword
                      }
                      onToggle={() =>
                        setShowCurrentPassword(
                          (value) => !value
                        )
                      }
                      onChange={(value) =>
                        updatePassword(
                          "current_password",
                          value
                        )
                      }
                    />

                    <div className="grid gap-5 sm:grid-cols-2">
                      <PasswordField
                        label="New password"
                        value={
                          passwords.new_password
                        }
                        visible={
                          showNewPassword
                        }
                        onToggle={() =>
                          setShowNewPassword(
                            (value) => !value
                          )
                        }
                        onChange={(value) =>
                          updatePassword(
                            "new_password",
                            value
                          )
                        }
                      />

                      <PasswordField
                        label="Confirm new password"
                        value={
                          passwords.confirm_password
                        }
                        visible={
                          showConfirmPassword
                        }
                        onToggle={() =>
                          setShowConfirmPassword(
                            (value) => !value
                          )
                        }
                        onChange={(value) =>
                          updatePassword(
                            "confirm_password",
                            value
                          )
                        }
                      />
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Password requirements
                      </p>

                      <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                        <PasswordRequirement
                          valid={
                            passwords.new_password
                              .length >= 8
                          }
                          text="At least 8 characters"
                        />

                        <PasswordRequirement
                          valid={
                            passwords.new_password &&
                            passwords.confirm_password &&
                            passwords.new_password ===
                              passwords.confirm_password
                          }
                          text="Passwords match"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-slate-100 pt-5">
                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <KeyRound size={17} />

                        {savingPassword
                          ? "Updating..."
                          : "Update password"}
                      </button>
                    </div>
                  </form>
                </SettingsCard>
              </>
            )}

            {/* Appearance */}
            {activeSection === "appearance" && (
              <SettingsCard
                icon={Palette}
                title="Appearance"
                description="Personalize how Darasa-AI looks and feels."
              >
                <div className="space-y-3">
                  <PreferenceRow
                    icon={
                      preferences.darkMode
                        ? Moon
                        : Sun
                    }
                    title="Dark mode"
                    description="Use a darker interface for comfortable viewing."
                    enabled={
                      preferences.darkMode
                    }
                    onToggle={() =>
                      updatePreference(
                        "darkMode",
                        !preferences.darkMode
                      )
                    }
                  />

                  <PreferenceRow
                    icon={Sparkles}
                    title="Compact mode"
                    description="Use tighter spacing to see more information."
                    enabled={
                      preferences.compactMode
                    }
                    onToggle={() =>
                      updatePreference(
                        "compactMode",
                        !preferences.compactMode
                      )
                    }
                  />

                  <PreferenceRow
                    icon={ChevronRight}
                    title="Reduce animations"
                    description="Minimize interface motion and transitions."
                    enabled={
                      preferences.reduceAnimations
                    }
                    onToggle={() =>
                      updatePreference(
                        "reduceAnimations",
                        !preferences.reduceAnimations
                      )
                    }
                  />
                </div>
              </SettingsCard>
            )}

            {/* Notifications */}
            {activeSection ===
              "notifications" && (
              <SettingsCard
                icon={Bell}
                title="Notifications"
                description="Choose whether learning notifications appear in your portal."
              >
                <PreferenceRow
                  icon={Bell}
                  title="Learning notifications"
                  description="Show important assessment, fee and school notifications."
                  enabled={
                    preferences.showNotifications
                  }
                  onToggle={() =>
                    updatePreference(
                      "showNotifications",
                      !preferences.showNotifications
                    )
                  }
                />
              </SettingsCard>
            )}

            {/* Account information */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <UserRound size={20} />
                </div>

                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">
                    Account
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {user?.role || "STUDENT"} account
                  </p>

                  {user?.school_name && (
                    <p className="mt-1 text-xs text-slate-400">
                      {user.school_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-start gap-4 border-b border-slate-100 pb-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Icon size={20} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function SettingsNavItem({
  active,
  icon: Icon,
  label,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
        active
          ? "bg-emerald-50 text-emerald-800"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          active
            ? "bg-emerald-700 text-white"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon size={17} />
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-semibold">
          {label}
        </span>

        <span className="block truncate text-xs opacity-60">
          {description}
        </span>
      </span>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  prefix,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {prefix}
          </span>
        )}

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className={`h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10 ${
            prefix ? "pl-8" : ""
          }`}
        />
      </div>
    </label>
  );
}

function PasswordField({
  label,
  value,
  visible,
  onToggle,
  onChange,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <div className="relative">
        <KeyRound
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-11 pr-12 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-emerald-700"
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
        >
          {visible ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>
      </div>
    </label>
  );
}

function PasswordRequirement({
  valid,
  text,
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full ${
          valid
            ? "bg-emerald-600 text-white"
            : "bg-slate-200 text-slate-400"
        }`}
      >
        <Check size={10} />
      </span>

      {text}
    </div>
  );
}

function PreferenceRow({
  icon: Icon,
  title,
  description,
  enabled,
  onToggle,
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={enabled}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          enabled
            ? "bg-emerald-600"
            : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default StudentSettings;