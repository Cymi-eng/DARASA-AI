import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext.jsx";
import AppShell from "./components/AppShell.jsx";

import Analytics from "./pages/Analytics.jsx";
import Classrooms from "./pages/Classrooms.jsx";
import Competencies from "./pages/Competencies.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Finance from "./pages/Finance.jsx";
import Login from "./pages/Login.jsx";
import StudentPortal from "./pages/StudentPortal.jsx";
import Students from "./pages/Students.jsx";
import TeacherPortal from "./pages/TeacherPortal.jsx";
import Teachers from "./pages/Teachers.jsx";


function getRoleHome(role) {
  switch (role) {
    case "STUDENT":
      return "/student-portal";

    case "TEACHER":
      return "/teacher-portal";

    case "BURSAR":
      return "/finance";

    case "PLATFORM_ADMIN":
    case "ADMIN":
    default:
      return "/dashboard";
  }
}


function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell>{children}</AppShell>;
}


function RoleRoute({ allowedRoles, children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={getRoleHome(user.role)}
        replace
      />
    );
  }

  return <AppShell>{children}</AppShell>;
}


function LoginRoute() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  if (!user) {
    return null;
  }

  return (
    <Navigate
      to={getRoleHome(user.role)}
      replace
    />
  );
}


function App() {
  return (
    <Routes>
      {/* Authentication */}
      <Route
        path="/login"
        element={<LoginRoute />}
      />

      {/* Admin */}
      <Route
        path="/dashboard"
        element={
          <RoleRoute
            allowedRoles={[
              "ADMIN",
              "PLATFORM_ADMIN",
            ]}
          >
            <Dashboard />
          </RoleRoute>
        }
      />

      <Route
        path="/students"
        element={
          <RoleRoute
            allowedRoles={[
              "ADMIN",
              "PLATFORM_ADMIN",
              "TEACHER",
            ]}
          >
            <Students />
          </RoleRoute>
        }
      />

      <Route
        path="/classrooms"
        element={
          <RoleRoute
            allowedRoles={[
              "ADMIN",
              "PLATFORM_ADMIN",
              "TEACHER",
            ]}
          >
            <Classrooms />
          </RoleRoute>
        }
      />

      <Route
        path="/teachers"
        element={
          <RoleRoute
            allowedRoles={[
              "ADMIN",
              "PLATFORM_ADMIN",
            ]}
          >
            <Teachers />
          </RoleRoute>
        }
      />

      <Route
        path="/competencies"
        element={
          <RoleRoute
            allowedRoles={[
              "ADMIN",
              "PLATFORM_ADMIN",
              "TEACHER",
            ]}
          >
            <Competencies />
          </RoleRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <RoleRoute
            allowedRoles={[
              "ADMIN",
              "PLATFORM_ADMIN",
            ]}
          >
            <Analytics />
          </RoleRoute>
        }
      />

      {/* Finance */}
      <Route
        path="/finance"
        element={
          <RoleRoute
            allowedRoles={[
              "ADMIN",
              "PLATFORM_ADMIN",
              "BURSAR",
            ]}
          >
            <Finance />
          </RoleRoute>
        }
      />

      {/* Teacher portal */}
      <Route
        path="/teacher-portal"
        element={
          <RoleRoute
            allowedRoles={[
              "TEACHER",
            ]}
          >
            <TeacherPortal />
          </RoleRoute>
        }
      />

      {/* Student portal */}
      <Route
        path="/student-portal"
        element={
          <RoleRoute
            allowedRoles={[
              "STUDENT",
            ]}
          >
            <StudentPortal />
          </RoleRoute>
        }
      />

      {/* Unknown routes */}
      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />
    </Routes>
  );
}


export default App;