import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Moon,
  Save,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { useState } from "react";

import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";


const SETTINGS_KEY =
  "darasa_student_settings";


function getSavedSettings() {
  try {
    const saved = localStorage.getItem(
      SETTINGS_KEY
    );

    if (!saved) {
      return {
        darkMode: false,
        compactMode: false,
        reduceMotion: false,
        showNotifications: true,
      };
    }

    return {
      darkMode: false,
      compactMode: false,
      reduceMotion: false,
      showNotifications: true,
      ...JSON.parse(saved),
    };
  } catch {
    return {
      darkMode: false,
      compactMode: false,
      reduceMotion: false,
      showNotifications: true,
    };
  }
}


function SettingToggle({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(!enabled)
      }
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#E4E8E2] bg-white p-4 text-left transition hover:bg-[#FAFBF9]"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
          <Icon size={19} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-[#294A3F]">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-[#87938D]">
            {description}
          </p>
        </div>
      </div>

      <div
        className={[
          "relative h-6 w-11 shrink-0 rounded-full transition",
          enabled
            ? "bg-[#0B5D43]"
            : "bg-[#CBD3CD]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
            enabled
              ? "left-6"
              : "left-1",
          ].join(" ")}
        />
      </div>
    </button>
  );
}


function StudentSettings() {
  const { user, logout } =
    useAuth();

  const savedSettings =
    getSavedSettings();

  const [settings, setSettings] =
    useState(savedSettings);

  const [username, setUsername] =
    useState(
      user?.username || ""
    );

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [savingAccount, setSavingAccount] =
    useState(false);

  const [savingPreferences, setSavingPreferences] =
    useState(false);

  const [accountMessage, setAccountMessage] =
    useState("");

  const [accountError, setAccountError] =
    useState("");

  const [preferenceMessage, setPreferenceMessage] =
    useState("");

  const updateSetting = (
    key,
    value
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const savePreferences = () => {
    setSavingPreferences(true);
    setPreferenceMessage("");

    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
      );

      window.dispatchEvent(
        new CustomEvent(
          "darasa-settings-changed",
          {
            detail: settings,
          }
        )
      );

      setPreferenceMessage(
        "Your preferences have been saved."
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  const saveAccount = async (
    event
  ) => {
    event.preventDefault();

    setAccountMessage("");
    setAccountError("");

    const usernameChanged =
      username.trim() !==
      (user?.username || "");

    const passwordChanged =
      Boolean(newPassword);

    if (
      !usernameChanged &&
      !passwordChanged
    ) {
      setAccountError(
        "No account changes were made."
      );

      return;
    }

    if (passwordChanged) {
      if (!currentPassword) {
        setAccountError(
          "Enter your current password."
        );

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setAccountError(
          "The new passwords do not match."
        );

        return;
      }

      if (newPassword.length < 8) {
        setAccountError(
          "Your new password must contain at least 8 characters."
        );

        return;
      }
    }

    setSavingAccount(true);

    try {
      const payload = {
        username:
          usernameChanged
            ? username.trim()
            : undefined,

        current_password:
          currentPassword ||
          undefined,

        new_password:
          passwordChanged
            ? newPassword
            : undefined,
      };

      const response =
        await api.post(
          "/users/me/settings/",
          payload
        );

      setAccountMessage(
        response.data?.detail ||
          "Account settings updated successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (
        response.data?.username
      ) {
        setUsername(
          response.data.username
        );
      }
    } catch (error) {
      const data =
        error.response?.data;

      let message =
        "We could not update your account settings.";

      if (data?.detail) {
        message = data.detail;
      } else if (
        data?.current_password
      ) {
        message =
          Array.isArray(
            data.current_password
          )
            ? data.current_password[0]
            : data.current_password;
      } else if (data?.username) {
        message =
          Array.isArray(
            data.username
          )
            ? data.username[0]
            : data.username;
      } else if (data?.new_password) {
        message =
          Array.isArray(
            data.new_password
          )
            ? data.new_password[0]
            : data.new_password;
      }

      setAccountError(message);
    } finally {
      setSavingAccount(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#17382E]">
          Settings
        </h1>

        <p className="mt-1 text-sm leading-6 text-[#7A8982]">
          Manage your account, security,
          appearance, and student workspace
          preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* ACCOUNT */}

        <section className="rounded-2xl border border-[#E4E8E2] bg-white shadow-sm">
          <div className="border-b border-[#E9ECE7] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
                <UserRound size={19} />
              </div>

              <div>
                <h2 className="font-bold text-[#17382E]">
                  Account
                </h2>

                <p className="mt-1 text-xs text-[#87938D]">
                  Update your student login
                  credentials.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={saveAccount}
            className="space-y-5 p-5 sm:p-6"
          >
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#718078]">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                autoComplete="username"
                className="w-full rounded-xl border border-[#DDE3DD] bg-[#FAFBF9] px-4 py-3 text-sm text-[#294A3F] outline-none transition focus:border-[#0B5D43] focus:ring-2 focus:ring-[#0B5D43]/10"
              />
            </div>

            <div className="border-t border-[#EEF0EC] pt-5">
              <div className="mb-4 flex items-center gap-2">
                <KeyRound
                  size={17}
                  className="text-[#0B5D43]"
                />

                <h3 className="text-sm font-bold text-[#294A3F]">
                  Change password
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <PasswordField
                  label="Current password"
                  value={currentPassword}
                  onChange={
                    setCurrentPassword
                  }
                  visible={
                    showCurrentPassword
                  }
                  setVisible={
                    setShowCurrentPassword
                  }
                  autoComplete="current-password"
                />

                <PasswordField
                  label="New password"
                  value={newPassword}
                  onChange={
                    setNewPassword
                  }
                  visible={
                    showNewPassword
                  }
                  setVisible={
                    setShowNewPassword
                  }
                  autoComplete="new-password"
                />

                <PasswordField
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={
                    setConfirmPassword
                  }
                  visible={
                    showConfirmPassword
                  }
                  setVisible={
                    setShowConfirmPassword
                  }
                  autoComplete="new-password"
                />
              </div>

              <p className="mt-3 text-xs text-[#89958F]">
                Passwords must contain at least
                8 characters.
              </p>
            </div>

            {accountError && (
              <div className="rounded-xl border border-[#F0D8D5] bg-[#FFF8F7] px-4 py-3 text-sm text-[#7D312C]">
                {accountError}
              </div>
            )}

            {accountMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-[#D7E9DE] bg-[#F1F8F3] px-4 py-3 text-sm text-[#276046]">
                <CheckCircle2
                  size={17}
                />
                {accountMessage}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingAccount}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0B5D43] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#084936] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAccount ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save account
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* APPEARANCE */}

        <section className="rounded-2xl border border-[#E4E8E2] bg-white shadow-sm">
          <div className="border-b border-[#E9ECE7] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3EE] text-[#0B5D43]">
                {settings.darkMode ? (
                  <Moon size={19} />
                ) : (
                  <Sun size={19} />
                )}
              </div>

              <div>
                <h2 className="font-bold text-[#17382E]">
                  Appearance
                </h2>

                <p className="mt-1 text-xs text-[#87938D]">
                  Personalise how Darasa-AI looks
                  and behaves.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-5 sm:p-6">
            <SettingToggle
              icon={settings.darkMode ? Moon : Sun}
              title="Dark theme"
              description="Use a darker interface throughout the student workspace."
              enabled={
                settings.darkMode
              }
              onChange={(value) =>
                updateSetting(
                  "darkMode",
                  value
                )
              }
            />

            <SettingToggle
              icon={ShieldCheck}
              title="Compact interface"
              description="Use tighter spacing to show more information on screen."
              enabled={
                settings.compactMode
              }
              onChange={(value) =>
                updateSetting(
                  "compactMode",
                  value
                )
              }
            />

            <SettingToggle
              icon={Eye}
              title="Reduce animations"
              description="Reduce interface transitions and motion effects."
              enabled={
                settings.reduceMotion
              }
              onChange={(value) =>
                updateSetting(
                  "reduceMotion",
                  value
                )
              }
            />
          </div>

          <div className="border-t border-[#E9ECE7] px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {preferenceMessage ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#276046]">
                  <CheckCircle2
                    size={15}
                  />
                  {preferenceMessage}
                </div>
              ) : (
                <p className="text-xs text-[#89958F]">
                  These preferences are saved on
                  this device.
                </p>
              )}

              <button
                type="button"
                onClick={
                  savePreferences
                }
                disabled={
                  savingPreferences
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#084936] disabled:opacity-60"
              >
                <Save size={15} />
                {savingPreferences
                  ? "Saving..."
                  : "Save preferences"}
              </button>
            </div>
          </div>
        </section>

        {/* NOTIFICATIONS */}

        <section className="rounded-2xl border border-[#E4E8E2] bg-white shadow-sm">
          <div className="border-b border-[#E9ECE7] px-5 py-5 sm:px-6">
            <h2 className="font-bold text-[#17382E]">
              Notifications
            </h2>

            <p className="mt-1 text-xs text-[#87938D]">
              Control notification visibility in
              your workspace.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <SettingToggle
              icon={ShieldCheck}
              title="Show notifications"
              description="Show school and learning notifications in the student workspace."
              enabled={
                settings.showNotifications
              }
              onChange={(value) =>
                updateSetting(
                  "showNotifications",
                  value
                )
              }
            />
          </div>
        </section>

        {/* SECURITY */}

        <section className="rounded-2xl border border-[#DCE9E1] bg-[#F2F8F4] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0B5D43] shadow-sm">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2 className="font-bold text-[#17382E]">
                Account security
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#6F8078]">
                Your password is securely handled
                by Django's authentication system.
                Never share your password with
                another person.
              </p>

              <p className="mt-3 text-xs font-semibold text-[#4D665C]">
                Logged in as:{" "}
                {user?.username ||
                  "Student"}
              </p>
            </div>
          </div>
        </section>

        {/* SIGN OUT */}

        <section className="rounded-2xl border border-[#F0D8D5] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-[#17382E]">
                Sign out
              </h2>

              <p className="mt-1 text-sm text-[#87938D]">
                Sign out of your Darasa-AI student
                account on this device.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8C9C5] bg-[#FFF8F7] px-4 py-2.5 text-sm font-bold text-[#8C4039] transition hover:bg-[#FCEDEB]"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}


function PasswordField({
  label,
  value,
  onChange,
  visible,
  setVisible,
  autoComplete,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#718078]">
        {label}
      </label>

      <div className="relative">
        <input
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          autoComplete={
            autoComplete
          }
          className="w-full rounded-xl border border-[#DDE3DD] bg-[#FAFBF9] px-4 py-3 pr-11 text-sm text-[#294A3F] outline-none transition focus:border-[#0B5D43] focus:ring-2 focus:ring-[#0B5D43]/10"
        />

        <button
          type="button"
          onClick={() =>
            setVisible(
              (current) => !current
            )
          }
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#7A8982] hover:bg-[#EEF2ED] hover:text-[#294A3F]"
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
    </div>
  );
}


export default StudentSettings;