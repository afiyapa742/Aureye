import { useState } from "react";

import {
  getuser,
  isblocked,
  userdelete
} from "../services/userservice";


export const useUsers = () => {

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");


  // =========================
  // GET USERS
  // =========================

  const fetchUsers = async () => {

    try {

      setLoading(true);
      setError("");

      const response = await getuser();

      console.log("Users response:", response);

      setUsers(response.users || []);

    } catch (error) {

      console.log("Users fetch error:", error);

      setError(
        error.response?.data?.message ||
        "Failed to fetch users"
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================
  // BLOCK / UNBLOCK
  // =========================

  const changeUserStatus = async (id, status) => {

    try {

      const response = await isblocked(
        id,
        status
      );

      console.log("Status updated:", response);

      // Update only that user in frontend
      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user._id === id
            ? {
                ...user,
                status: status
              }
            : user
        )
      );

      return response;

    } catch (error) {

      console.log(
        "User status update error:",
        error
      );

      throw error;
    }
  };


  // =========================
  // DELETE USER
  // =========================

  const deleteUser = async (id) => {

    try {

      const response = await userdelete(id);

      console.log("User deleted:", response);


      // IMPORTANT
      // Remove deleted user from frontend list

      setUsers((previousUsers) =>
        previousUsers.filter(
          (user) => user._id !== id
        )
      );


      return response;

    } catch (error) {

      console.log(
        "User delete error:",
        error
      );

      throw error;
    }
  };


  return {
    users,
    loading,
    error,

    fetchUsers,

    changeUserStatus,

    deleteUser
  };
};