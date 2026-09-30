import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bell,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Mail,
  Moon,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  User,
  UserRound,
  X,
  Zap,
} from "lucide-react";

import api from "../api";

import {
  getStudentSettings,
  saveStudentSettings,
  resetStudentSettings,
} from "../theme";

import {
  logout as clearAuthTokens,
} from "../auth";


// ---------------------------------------------------------------------
// DEFAULT ACCOUNT
// ---------------------------------------------------------------------

const EMPTY_ACCOUNT = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
};


// ---------------------------------------------------------------------
// DEFAULT PASSWORD
// ---------------------------------------------------------------------

const EMPTY_PASSWORD = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};


// ---------------------------------------------------------------------
// SETTINGS SECTIONS
// ---------------------------------------------------------------------

const SETTINGS_SECTIONS = [
  {
    id: "profile",
    label: "Profile",
    description: "Personal information",
    icon: UserRound,
  },

  {
    id: "security",
    label: "Security",
    description: "Password and access",
    icon: ShieldCheck,
  },

  {
    id: "appearance",
    label: "Appearance",
    description: "Portal preferences",
    icon: Moon,
  },

  {
    id: "notifications",
    label: "Notifications",
    description: "Notification preferences",
    icon: Bell,
  },
];


// ---------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------

function StudentSettings() {

  // ================================================================
  // STATE
  // ================================================================

  const [
    activeSection,
    setActiveSection,
  ] = useState("profile");

  const [
    account,
    setAccount,
  ] = useState(EMPTY_ACCOUNT);

  const [
    passwordForm,
    setPasswordForm,
  ] = useState(EMPTY_PASSWORD);

  const [
    settings,
    setSettings,
  ] = useState(() =>
    getStudentSettings()
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    savingProfile,
    setSavingProfile,
  ] = useState(false);

  const [
    changingPassword,
    setChangingPassword,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    passwordVisibility,
    setPasswordVisibility,
  ] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [
    showResetConfirmation,
    setShowResetConfirmation,
  ] = useState(false);


  // ================================================================
  // LOAD SETTINGS FROM BACKEND
  // ================================================================

  useEffect(() => {

    async function loadAccountSettings() {

      setLoading(true);

      setError("");

      try {

        const response = await api.get(
          "/users/me/settings/"
        );

        const data = response.data;

        setAccount({
          username:
            data.username || "",

          first_name:
            data.first_name || "",

          last_name:
            data.last_name || "",

          email:
            data.email || "",
        });

      } catch (requestError) {

        setError(
          getErrorMessage(
            requestError,
            "Unable to load your account settings."
          )
        );

      } finally {

        setLoading(false);
      }
    }

    loadAccountSettings();

  }, []);


  // ================================================================
  // CLEAR SUCCESS MESSAGE
  // ================================================================

  useEffect(() => {

    if (!success) {
      return;
    }

    const timer = window.setTimeout(
      () => {
        setSuccess("");
      },
      4500
    );

    return () => {
      window.clearTimeout(timer);
    };

  }, [success]);


  // ================================================================
  // ACCOUNT FIELD CHANGE
  // ================================================================

  function handleAccountChange(
    event
  ) {

    const {
      name,
      value,
    } = event.target;

    setAccount(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  }


  // ================================================================
  // PASSWORD FIELD CHANGE
  // ================================================================

  function handlePasswordChange(
    event
  ) {

    const {
      name,
      value,
    } = event.target;

    setPasswordForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  }


  // ================================================================
  // SAVE PROFILE TO BACKEND
  // ================================================================

  async function handleSaveProfile(
    event
  ) {

    event.preventDefault();

    setSavingProfile(true);

    setError("");

    setSuccess("");

    try {

      const payload = {
        username:
          account.username.trim(),

        first_name:
          account.first_name.trim(),

        last_name:
          account.last_name.trim(),

        email:
          account.email.trim(),
      };

      const response = await api.post(
        "/users/me/settings/",
        payload
      );

      const updatedUser =
        response.data.user;

      setAccount({
        username:
          updatedUser.username || "",

        first_name:
          updatedUser.first_name || "",

        last_name:
          updatedUser.last_name || "",

        email:
          updatedUser.email || "",
      });

      setSuccess(
        "Your profile has been saved to the backend."
      );

    } catch (requestError) {

      setError(
        getErrorMessage(
          requestError,
          "Unable to save your profile."
        )
      );

    } finally {

      setSavingProfile(false);
    }
  }


  // ================================================================
  // CHANGE PASSWORD
  // ================================================================

  async function handleChangePassword(
    event
  ) {

    event.preventDefault();

    setChangingPassword(true);

    setError("");

    setSuccess("");

    try {

      if (
        !passwordForm.current_password
      ) {

        throw createClientError(
          "Current password is required."
        );
      }

      if (
        !passwordForm.new_password
      ) {

        throw createClientError(
          "New password is required."
        );
      }

      if (
        passwordForm.new_password.length < 8
      ) {

        throw createClientError(
          "New password must contain at least 8 characters."
        );
      }

      if (
        passwordForm.new_password !==
        passwordForm.confirm_password
      ) {

        throw createClientError(
          "New passwords do not match."
        );
      }

      const response = await api.post(
        "/users/me/settings/",
        {
          current_password:
            passwordForm.current_password,

          new_password:
            passwordForm.new_password,

          confirm_password:
            passwordForm.confirm_password,
        }
      );

      // ------------------------------------------------------------
      // STORE FRESH JWT TOKENS
      // ------------------------------------------------------------

      if (
        response.data.tokens
      ) {

        localStorage.setItem(
          "darasa_access_token",
          response.data.tokens.access
        );

        localStorage.setItem(
          "darasa_refresh_token",
          response.data.tokens.refresh
        );
      }

      // ------------------------------------------------------------
      // CLEAR PASSWORD FORM
      // ------------------------------------------------------------

      setPasswordForm(
        EMPTY_PASSWORD
      );

      setSuccess(
        "Your password has been changed and saved securely in the backend."
      );

    } catch (requestError) {

      setError(
        getErrorMessage(
          requestError,
          "Unable to change your password."
        )
      );

    } finally {

      setChangingPassword(false);
    }
  }


  // ================================================================
  // APPEARANCE CHANGE
  // ================================================================

  function updateAppearance(
    field,
    value
  ) {

    const updated = {
      ...settings,
      [field]: value,
    };

    setSettings(updated);

    saveStudentSettings(
      updated
    );
  }


  // ================================================================
  // RESET APPEARANCE
  // ================================================================

  function handleResetAppearance() {

    const defaults =
      resetStudentSettings();

    setSettings(defaults);

    setSuccess(
      "Appearance preferences have been reset."
    );
  }


  // ================================================================
  // NOTIFICATION CHANGE
  // ================================================================

  function updateNotificationSetting(
    value
  ) {

    const updated = {
      ...settings,
      showNotifications: value,
    };

    setSettings(updated);

    saveStudentSettings(
      updated
    );
  }


  // ================================================================
  // LOGOUT
  // ================================================================

  function handleLogout() {

    clearAuthTokens();

    window.location.href =
      "/login";
  }


  // ================================================================
  // PASSWORD STRENGTH
  // ================================================================

  const passwordStrength =
    useMemo(() => {

      const password =
        passwordForm.new_password;

      if (!password) {
        return {
          label: "Not set",
          width: "0%",
        };
      }

      let score = 0;

      if (password.length >= 8) {
        score += 1;
      }

      if (
        /[A-Z]/.test(password)
      ) {
        score += 1;
      }

      if (
        /[0-9]/.test(password)
      ) {
        score += 1;
      }

      if (
        /[^A-Za-z0-9]/.test(password)
      ) {
        score += 1;
      }

      if (score <= 1) {
        return {
          label: "Weak",
          width: "25%",
        };
      }

      if (score === 2) {
        return {
          label: "Fair",
          width: "50%",
        };
      }

      if (score === 3) {
        return {
          label: "Good",
          width: "75%",
        };
      }

      return {
        label: "Strong",
        width: "100%",
      };

    }, [
      passwordForm.new_password,
    ]);


  // ================================================================
  // LOADING
  // ================================================================

  if (loading) {

    return (
      <div className="flex min-h-[60vh] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#DCE7E1] border-t-[#0B5D43]" />

          <p className="mt-4 text-sm font-medium text-[#66766F]">
            Loading your account settings...
          </p>

        </div>

      </div>
    );
  }


  // ================================================================
  // UI
  // ================================================================

  return (

    <div className="mx-auto max-w-7xl space-y-6 pb-10">

      {/* ============================================================
          HEADER
      ============================================================ */}

      <div className="rounded-3xl border border-[#E2E8E3] bg-white p-6 shadow-sm sm:p-8">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF4EE] text-[#0B5D43]">

              <SettingsIcon
                size={27}
              />

            </div>

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B5D43]">
                Account
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#12382D]">
                Student Settings
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71807A]">
                Manage your account information, password,
                appearance and notification preferences.
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2D3D0] bg-white px-4 py-2.5 text-sm font-semibold text-[#A23A30] transition hover:bg-[#FFF5F3]"
          >
            <LogOut size={17} />
            Sign out
          </button>

        </div>

      </div>


      {/* ============================================================
          ALERTS
      ============================================================ */}

      {success && (

        <div className="flex items-start gap-3 rounded-2xl border border-[#B8D9C6] bg-[#EEF9F2] px-5 py-4 text-sm text-[#17633F]">

          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>

            <p className="font-bold">
              Saved successfully
            </p>

            <p className="mt-1">
              {success}
            </p>

          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="ml-auto"
          >
            <X size={17} />
          </button>

        </div>
      )}


      {error && (

        <div className="flex items-start gap-3 rounded-2xl border border-[#F1C7C2] bg-[#FFF4F2] px-5 py-4 text-sm text-[#B42318]">

          <X
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>

            <p className="font-bold">
              Something went wrong
            </p>

            <p className="mt-1">
              {error}
            </p>

          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto"
          >
            <X size={17} />
          </button>

        </div>
      )}


      {/* ============================================================
          MAIN SETTINGS LAYOUT
      ============================================================ */}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">


        {/* ==========================================================
            SIDEBAR
        ========================================================== */}

        <aside className="h-fit rounded-3xl border border-[#E2E8E3] bg-white p-3 shadow-sm">

          <div className="px-4 pb-3 pt-4">

            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#87938E]">
              Settings
            </p>

          </div>

          <div className="space-y-1">

            {SETTINGS_SECTIONS.map(
              (section) => {

                const Icon =
                  section.icon;

                const active =
                  activeSection ===
                  section.id;

                return (

                  <button
                    key={section.id}
                    type="button"
                    onClick={() =>
                      setActiveSection(
                        section.id
                      )
                    }
                    className={[
                      "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition",
                      active
                        ? "bg-[#EAF4EE] text-[#0B5D43]"
                        : "text-[#64736D] hover:bg-[#F5F7F4]",
                    ].join(" ")}
                  >

                    <div
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        active
                          ? "bg-white"
                          : "bg-[#F3F5F2]",
                      ].join(" ")}
                    >

                      <Icon
                        size={18}
                      />

                    </div>

                    <div className="min-w-0">

                      <p className="text-sm font-bold">
                        {section.label}
                      </p>

                      <p className="mt-0.5 truncate text-xs opacity-70">
                        {section.description}
                      </p>

                    </div>

                  </button>
                );
              }
            )}

          </div>


          {/* SECURITY NOTE */}

          <div className="mt-5 rounded-2xl bg-[#F7F9F6] p-4">

            <div className="flex items-start gap-3">

              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-[#0B5D43]"
              />

              <div>

                <p className="text-xs font-bold text-[#17382E]">
                  Your account is protected
                </p>

                <p className="mt-1 text-xs leading-5 text-[#7B8882]">
                  Account credentials are managed securely
                  by the Darasa-AI backend.
                </p>

              </div>

            </div>

          </div>

        </aside>


        {/* ==========================================================
            CONTENT
        ========================================================== */}

        <main className="min-w-0">


          {/* ========================================================
              PROFILE
          ======================================================== */}

          {activeSection === "profile" && (

            <section className="rounded-3xl border border-[#E2E8E3] bg-white p-6 shadow-sm sm:p-8">

              <SectionHeader
                icon={User}
                title="Personal information"
                description="These details are stored on your Darasa-AI account."
              />

              <form
                onSubmit={
                  handleSaveProfile
                }
                className="mt-8 space-y-6"
              >

                <div className="grid gap-5 md:grid-cols-2">

                  <Field
                    label="Username"
                    name="username"
                    value={
                      account.username
                    }
                    onChange={
                      handleAccountChange
                    }
                    icon={UserRound}
                    required
                  />

                  <Field
                    label="Email address"
                    name="email"
                    type="email"
                    value={
                      account.email
                    }
                    onChange={
                      handleAccountChange
                    }
                    icon={Mail}
                  />

                  <Field
                    label="First name"
                    name="first_name"
                    value={
                      account.first_name
                    }
                    onChange={
                      handleAccountChange
                    }
                    icon={User}
                    required
                  />

                  <Field
                    label="Last name"
                    name="last_name"
                    value={
                      account.last_name
                    }
                    onChange={
                      handleAccountChange
                    }
                    icon={User}
                    required
                  />

                </div>


                <div className="rounded-2xl border border-[#E3EAE5] bg-[#F8FAF8] p-4">

                  <div className="flex items-start gap-3">

                    <ShieldCheck
                      size={19}
                      className="mt-0.5 text-[#0B5D43]"
                    />

                    <div>

                      <p className="text-sm font-bold text-[#17382E]">
                        Backend synchronized
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#73817B]">
                        Saving this form updates your actual
                        Django user account, not just the browser.
                      </p>

                    </div>

                  </div>

                </div>


                <div className="flex justify-end border-t border-[#E9EDE9] pt-6">

                  <button
                    type="submit"
                    disabled={
                      savingProfile
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#084936] disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {savingProfile ? (

                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Saving...
                      </>

                    ) : (

                      <>
                        <Save size={18} />
                        Save profile
                      </>

                    )}

                  </button>

                </div>

              </form>

            </section>
          )}


          {/* ========================================================
              SECURITY
          ======================================================== */}

          {activeSection === "security" && (

            <section className="rounded-3xl border border-[#E2E8E3] bg-white p-6 shadow-sm sm:p-8">

              <SectionHeader
                icon={KeyRound}
                title="Password & security"
                description="Change the password used to sign in to Darasa-AI."
              />

              <form
                onSubmit={
                  handleChangePassword
                }
                className="mt-8 space-y-6"
              >

                <PasswordField
                  label="Current password"
                  name="current_password"
                  value={
                    passwordForm.current_password
                  }
                  onChange={
                    handlePasswordChange
                  }
                  visible={
                    passwordVisibility.current
                  }
                  onToggle={() =>
                    setPasswordVisibility(
                      (current) => ({
                        ...current,
                        current:
                          !current.current,
                      })
                    )
                  }
                />


                <div className="grid gap-5 md:grid-cols-2">

                  <PasswordField
                    label="New password"
                    name="new_password"
                    value={
                      passwordForm.new_password
                    }
                    onChange={
                      handlePasswordChange
                    }
                    visible={
                      passwordVisibility.new
                    }
                    onToggle={() =>
                      setPasswordVisibility(
                        (current) => ({
                          ...current,
                          new:
                            !current.new,
                        })
                      )
                    }
                  />

                  <PasswordField
                    label="Confirm new password"
                    name="confirm_password"
                    value={
                      passwordForm.confirm_password
                    }
                    onChange={
                      handlePasswordChange
                    }
                    visible={
                      passwordVisibility.confirm
                    }
                    onToggle={() =>
                      setPasswordVisibility(
                        (current) => ({
                          ...current,
                          confirm:
                            !current.confirm,
                        })
                      )
                    }
                  />

                </div>


                {/* PASSWORD STRENGTH */}

                <div className="rounded-2xl border border-[#E3EAE5] bg-[#F8FAF8] p-5">

                  <div className="flex items-center justify-between">

                    <p className="text-sm font-bold text-[#17382E]">
                      Password strength
                    </p>

                    <span className="text-xs font-bold text-[#64736D]">
                      {passwordStrength.label}
                    </span>

                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E4EAE5]">

                    <div
                      className="h-full rounded-full bg-[#0B5D43] transition-all"
                      style={{
                        width:
                          passwordStrength.width,
                      }}
                    />

                  </div>

                  <div className="mt-4 grid gap-2 text-xs text-[#687770] sm:grid-cols-2">

                    <PasswordRequirement
                      valid={
                        passwordForm.new_password.length >= 8
                      }
                    >
                      At least 8 characters
                    </PasswordRequirement>

                    <PasswordRequirement
                      valid={
                        /[A-Z]/.test(
                          passwordForm.new_password
                        )
                      }
                    >
                      One uppercase letter
                    </PasswordRequirement>

                    <PasswordRequirement
                      valid={
                        /[0-9]/.test(
                          passwordForm.new_password
                        )
                      }
                    >
                      One number
                    </PasswordRequirement>

                    <PasswordRequirement
                      valid={
                        /[^A-Za-z0-9]/.test(
                          passwordForm.new_password
                        )
                      }
                    >
                      One special character
                    </PasswordRequirement>

                  </div>

                </div>


                {/* PASSWORD BACKEND NOTICE */}

                <div className="rounded-2xl border border-[#BFDAC9] bg-[#EFF8F2] p-5">

                  <div className="flex items-start gap-3">

                    <ShieldCheck
                      size={21}
                      className="mt-0.5 shrink-0 text-[#0B5D43]"
                    />

                    <div>

                      <p className="text-sm font-bold text-[#17382E]">
                        Secure backend update
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#5E7168]">
                        Your password is hashed by Django before
                        it is stored. The plain-text password is
                        never saved in the database.
                      </p>

                    </div>

                  </div>

                </div>


                <div className="flex justify-end border-t border-[#E9EDE9] pt-6">

                  <button
                    type="submit"
                    disabled={
                      changingPassword
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B5D43] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#084936] disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {changingPassword ? (

                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Updating password...
                      </>

                    ) : (

                      <>
                        <KeyRound size={18} />
                        Change password
                      </>

                    )}

                  </button>

                </div>

              </form>

            </section>
          )}


          {/* ========================================================
              APPEARANCE
          ======================================================== */}

          {activeSection === "appearance" && (

            <section className="rounded-3xl border border-[#E2E8E3] bg-white p-6 shadow-sm sm:p-8">

              <SectionHeader
                icon={Moon}
                title="Appearance"
                description="Customize how the student portal feels and behaves."
              />

              <div className="mt-8 space-y-4">

                <SettingToggle
                  icon={Moon}
                  title="Dark mode"
                  description="Use a darker interface for lower-light environments."
                  checked={
                    settings.darkMode
                  }
                  onChange={(value) =>
                    updateAppearance(
                      "darkMode",
                      value
                    )
                  }
                />

                <SettingToggle
                  icon={Zap}
                  title="Compact mode"
                  description="Reduce spacing so more information fits on the screen."
                  checked={
                    settings.compactMode
                  }
                  onChange={(value) =>
                    updateAppearance(
                      "compactMode",
                      value
                    )
                  }
                />

                <SettingToggle
                  icon={Smartphone}
                  title="Reduce animations"
                  description="Minimize motion and transitions throughout the portal."
                  checked={
                    settings.reduceAnimations
                  }
                  onChange={(value) =>
                    updateAppearance(
                      "reduceAnimations",
                      value
                    )
                  }
                />

              </div>


              <div className="mt-8 border-t border-[#E9EDE9] pt-6">

                <button
                 onClick={() =>
  setShowResetConfirmation(true)
}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4DF] bg-white px-4 py-2.5 text-sm font-bold text-[#52635B] transition hover:bg-[#F6F8F6]"
                >

                  <RotateCcw
                    size={17}
                  />

                  Reset appearance

                </button>

              </div>

            </section>
          )}


          {/* ========================================================
              NOTIFICATIONS
          ======================================================== */}

          {activeSection === "notifications" && (

            <section className="rounded-3xl border border-[#E2E8E3] bg-white p-6 shadow-sm sm:p-8">

              <SectionHeader
                icon={Bell}
                title="Notifications"
                description="Control notification visibility inside your student portal."
              />

              <div className="mt-8">

                <SettingToggle
                  icon={Bell}
                  title="Show notifications"
                  description="Display school, assessment and account notifications in the portal."
                  checked={
                    settings.showNotifications
                  }
                  onChange={
                    updateNotificationSetting
                  }
                />

              </div>


              <div className="mt-6 rounded-2xl bg-[#F7F9F6] p-5">

                <div className="flex items-start gap-3">

                  <Bell
                    size={20}
                    className="mt-0.5 text-[#0B5D43]"
                  />

                  <div>

                    <p className="text-sm font-bold text-[#17382E]">
                      Notification delivery
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#718079]">
                      School-issued notifications are controlled
                      by the Darasa-AI backend. This setting
                      controls whether they are displayed in
                      your portal.
                    </p>

                  </div>

                </div>

              </div>

            </section>
          )}

        </main>

      </div>


      {/* ============================================================
          RESET CONFIRMATION
      ============================================================ */}

      {showResetConfirmation && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10231D]/40 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF4E5] text-[#A36B00]">

              <RotateCcw size={22} />

            </div>

            <h2 className="mt-5 text-xl font-bold text-[#17382E]">
              Reset appearance?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#718079]">
              This will restore the default appearance
              preferences for the student portal.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setShowResetConfirmation(
                    false
                  )
                }
                className="rounded-xl border border-[#DCE4DF] px-4 py-2.5 text-sm font-bold text-[#53635B]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {

                  handleResetAppearance();

                  setShowResetConfirmation(
                    false
                  );

                }}
                className="rounded-xl bg-[#0B5D43] px-4 py-2.5 text-sm font-bold text-white"
              >
                Reset
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}


// ---------------------------------------------------------------------
// SECTION HEADER
// ---------------------------------------------------------------------

function SectionHeader({
  icon: Icon,
  title,
  description,
}) {

  return (

    <div className="flex items-start gap-4">

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF4EE] text-[#0B5D43]">

        <Icon size={20} />

      </div>

      <div>

        <h2 className="text-xl font-bold text-[#17382E]">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-[#718079]">
          {description}
        </p>

      </div>

    </div>
  );
}


// ---------------------------------------------------------------------
// FIELD
// ---------------------------------------------------------------------

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  icon: Icon,
  required = false,
}) {

  return (

    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-bold text-[#40544C]"
      >
        {label}
      </label>

      <div className="relative">

        <Icon
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9791]"
        />

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full rounded-xl border border-[#DCE4DF] bg-white py-3 pl-11 pr-4 text-sm text-[#17382E] outline-none transition placeholder:text-[#A2ADA8] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
        />

      </div>

    </div>
  );
}


// ---------------------------------------------------------------------
// PASSWORD FIELD
// ---------------------------------------------------------------------

function PasswordField({
  label,
  name,
  value,
  onChange,
  visible,
  onToggle,
}) {

  return (

    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-bold text-[#40544C]"
      >
        {label}
      </label>

      <div className="relative">

        <KeyRound
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9791]"
        />

        <input
          id={name}
          name={name}
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-[#DCE4DF] bg-white py-3 pl-11 pr-12 text-sm text-[#17382E] outline-none transition placeholder:text-[#A2ADA8] focus:border-[#0B5D43] focus:ring-4 focus:ring-[#0B5D43]/10"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-1.5 text-[#75837D] hover:bg-[#F1F4F1]"
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
        >

          {visible ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}

        </button>

      </div>

    </div>
  );
}


// ---------------------------------------------------------------------
// PASSWORD REQUIREMENT
// ---------------------------------------------------------------------

function PasswordRequirement({
  valid,
  children,
}) {

  return (

    <div className="flex items-center gap-2">

      <span
        className={[
          "flex h-5 w-5 items-center justify-center rounded-full",
          valid
            ? "bg-[#DDF2E5] text-[#0B5D43]"
            : "bg-[#E8ECE9] text-[#8A9690]",
        ].join(" ")}
      >

        {valid ? (
          <Check size={12} />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}

      </span>

      <span>{children}</span>

    </div>
  );
}


// ---------------------------------------------------------------------
// SETTING TOGGLE
// ---------------------------------------------------------------------

function SettingToggle({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}) {

  return (

    <div className="flex items-center gap-4 rounded-2xl border border-[#E3EAE5] p-5">

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3F6F3] text-[#0B5D43]">

        <Icon size={20} />

      </div>

      <div className="min-w-0 flex-1">

        <p className="text-sm font-bold text-[#17382E]">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-[#718079]">
          {description}
        </p>

      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() =>
          onChange(!checked)
        }
        className={[
          "relative h-7 w-12 shrink-0 rounded-full transition",
          checked
            ? "bg-[#0B5D43]"
            : "bg-[#CBD5D0]",
        ].join(" ")}
      >

        <span
          className={[
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition",
            checked
              ? "left-6"
              : "left-1",
          ].join(" ")}
        />

      </button>

    </div>
  );
}


// ---------------------------------------------------------------------
// ERROR HELPERS
// ---------------------------------------------------------------------

function getErrorMessage(
  error,
  fallback
) {

  if (
    error?.isClientError &&
    error.message
  ) {
    return error.message;
  }

  const data =
    error?.response?.data;

  if (!data) {
    return (
      error?.message ||
      fallback
    );
  }

  if (
    typeof data === "string"
  ) {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  const possibleFields = [
    "username",
    "email",
    "current_password",
    "new_password",
    "confirm_password",
  ];

  for (
    const field of possibleFields
  ) {

    if (data[field]) {

      if (
        Array.isArray(
          data[field]
        )
      ) {
        return data[field][0];
      }

      return String(
        data[field]
      );
    }
  }

  return fallback;
}


// ---------------------------------------------------------------------
// CLIENT ERROR
// ---------------------------------------------------------------------

function createClientError(
  message
) {

  const error =
    new Error(message);

  error.isClientError = true;

  return error;
}


export default StudentSettings;