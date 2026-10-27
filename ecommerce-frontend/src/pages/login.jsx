import React from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import { useLogin } from "../hooks/userlogin";
import { googleLogin } from "../service/Authservice";

import "./login.css";

const Login = () => {
  const navigate = useNavigate();

  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    error,
    loading,
    handleSubmit,
  } = useLogin();

  const isEmailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="login-page">
      <main className="login-card">

        {/* =========================
            TITLE
        ========================== */}

        <h1 className="login-title">
          Login
        </h1>

        <form onSubmit={handleSubmit} noValidate>

          {/* =========================
              EMAIL
          ========================== */}

          <div className="login-field">

            <label htmlFor="email">
              Email address
            </label>

            <div className="login-input-wrap">

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
                placeholder="helloworld@gmail.com"
              />

              {isEmailValid && (
                <CheckCircle2
                  size={18}
                  className="login-check-icon"
                />
              )}

            </div>

          </div>


          {/* =========================
              PASSWORD
          ========================== */}

          <div className="login-field">

            <label htmlFor="password">
              Password
            </label>

            <div className="login-input-wrap">

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                autoComplete="current-password"
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


            {/* =========================
                FORGOT PASSWORD
            ========================== */}

            <div className="login-forgot">

              <Link to="/forgot-password">
                Forgot password?
              </Link>

            </div>

          </div>


          {/* =========================
              LOGIN BUTTON
          ========================== */}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading
              ? "Logging in…"
              : "Log in"}
          </button>


          {/* =========================
              ERROR MESSAGE
          ========================== */}

          {error && (
            <p
              className="login-error"
              role="alert"
            >
              {error}
            </p>
          )}


          {/* =========================
              OR
          ========================== */}

          <div className="login-divider">
            <span>OR</span>
          </div>


          {/* =========================
              GOOGLE LOGIN
          ========================== */}

          <div className="login-google">

            <GoogleLogin

              onSuccess={async (
                credentialResponse
              ) => {

                try {

                  console.log(
                    "GOOGLE CREDENTIAL:",
                    credentialResponse
                  );


                  // ==========================
                  // GET GOOGLE ID TOKEN
                  // ==========================

                  const idToken =
                    credentialResponse.credential;

                  if (!idToken) {

                    console.error(
                      "Google ID token not received"
                    );

                    return;
                  }


                  // ==========================
                  // SEND TO BACKEND
                  // ==========================

                  const data =
                    await googleLogin(idToken);


                  console.log(
                    "GOOGLE LOGIN SUCCESS:",
                    data
                  );


                  // ==========================
                  // SAVE TOKEN
                  // ==========================

                  if (data?.token) {

                    localStorage.setItem(
                      "token",
                      data.token
                    );

                  }


                  // ==========================
                  // SAVE USER
                  // ==========================

                  if (data) {

                    const userData = {
                      _id: data._id,
                      FullName: data.FullName,
                      email: data.email,
                      profileImage:
                        data.profileImage || null,
                    };

                    localStorage.setItem(
                      "user",
                      JSON.stringify(userData)
                    );

                  }


                  // ==========================
                  // GO TO HOME
                  // ==========================

                  navigate("/", {
                    replace: true,
                  });

                } catch (error) {

                  console.error(
                    "GOOGLE LOGIN ERROR:",
                    error?.response?.data ||
                      error?.message ||
                      error
                  );

                }

              }}


              onError={() => {

                console.error(
                  "Google Login Failed"
                );

              }}

            />

          </div>


          {/* =========================
              SIGN UP
          ========================== */}

          <p className="login-signup">

            New user?{" "}

            <Link to="/signup">
              Sign up
            </Link>

          </p>

        </form>

      </main>
    </div>
  );
};

export default Login;