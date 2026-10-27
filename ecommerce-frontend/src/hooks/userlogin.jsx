import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAPI } from "../service/Authservice";

export const useLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  // ==========================================
  // SHOW / HIDE PASSWORD
  // ==========================================

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };


  // ==========================================
  // LOGIN
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      const response = await loginAPI({
        email: email.trim(),
        password,
      });

      console.log("LOGIN RESPONSE:", response);


      // ==========================================
      // SAVE TOKEN
      // ==========================================

      if (!response?.token) {
        setError("Login failed: token not received.");
        return;
      }

      localStorage.setItem("token", response.token);


      // ==========================================
      // SAVE USER
      // ==========================================

      const user = response.user || {
        _id: response._id,
        FullName: response.FullName,
        email: response.email,
        MobileNumber: response.MobileNumber,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );


      // ==========================================
      // GO HOME
      // ==========================================

      navigate("/home", {
        replace: true,
      });

    } catch (err) {
      console.error("LOGIN ERROR:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Login failed";

      setError(message);

    } finally {
      setLoading(false);
    }
  };


  return {
    email,
    setEmail,

    password,
    setPassword,

    showPassword,
    toggleShowPassword,

    error,
    loading,

    handleSubmit,
  };
};