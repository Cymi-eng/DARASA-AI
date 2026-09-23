import { useState } from "react";

import { useAuth } from "./context/AuthContext.jsx";

function App() {
  const { isAuthenticated, login, logout } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      await login(username, password);
    } catch (requestError) {
      const message =
        requestError.response?.data?.detail ||
        "Login failed. Please check your username and password.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return (
      <main>
        <h1>Darasa-AI</h1>
        <p>You are authenticated.</p>

        <button type="button" onClick={logout}>
          Logout
        </button>
      </main>
    );
  }

  return (
    <main>
      <h1>Darasa-AI</h1>
      <p>School Management & Adaptive Learning Platform</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}

export default App;