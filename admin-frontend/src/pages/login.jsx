import { useState } from "react";
import { useAuth } from "../Hooks/adminAuth";
import "./login.css";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const {
    email,
    password,
    setEmail,
    setPassword,
    login,
  } = useAuth();

  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await login();

      setMessage(response.message);

      // Login successful → Dashboard
      if (response) {
        navigate("/admin", { replace: true });
      }

    } catch (error) {
      setMessage(
        error.response?.data?.message || "Login failed"
      );
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <h1>Login</h1>

        <form onSubmit={handleLogin}>

          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>

          <div className="password-wrapper">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              className="login-eye-toggle"
              onClick={toggleShowPassword}
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? (
                <Eye size={18} />
              ) : (
                <EyeOff size={18} />
              )}
            </button>

          </div>

          <p className="forgot-password">
            Forgot password?
          </p>

          <button
            type="submit"
            className="login-button"
          >
            Log in
          </button>

          {message && (
            <p className="login-message">
              {message}
            </p>
          )}

        </form>

      </div>

    </div>
  );
};

export default Login;