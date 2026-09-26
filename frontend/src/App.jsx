import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext.jsx";
import AppShell from "./components/AppShell.jsx";

import Analytics from "./pages/Analytics.jsx";
import Classrooms from "./pages/Classrooms.jsx";
import Competencies from "./pages/Competencies.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Finance from "./pages/Finance.jsx";
import Login from "./pages/Login.jsx";
import Students from "./pages/Students.jsx";
import TeacherPortal from "./pages/TeacherPortal.jsx";
import Teachers from "./pages/Teachers.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell>{children}</AppShell>;
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/students"
        element={
          <ProtectedRoute>
            <Students />
          </ProtectedRoute>
        }
      />

      <Route
        path="/classrooms"
        element={
          <ProtectedRoute>
            <Classrooms />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teachers"
        element={
          <ProtectedRoute>
            <Teachers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/competencies"
        element={
          <ProtectedRoute>
            <Competencies />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/finance"
        element={
          <ProtectedRoute>
            <Finance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher-portal"
        element={
          <ProtectedRoute>
            <TeacherPortal />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? "/dashboard" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;