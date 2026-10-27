import loginAdmin from "../services/Authservice";
import { useState } from "react";

export const useAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    const data = await loginAdmin({
      email,
      password,
    });

    // Save admin login status
    localStorage.setItem("adminLoggedIn", "true");

    return data;
  };

  const logout = async () => {
  localStorage.removeItem("adminLoggedIn");
};

  return {
    email,
    password,
    setEmail,
    setPassword,
    login,
    logout
  };
};