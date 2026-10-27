import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    FullName: "",
    email: "",
    MobileNumber: "",
  });

  const fullNameRef = useRef(null);


  // ==========================================
  // LOAD USER FROM LOCAL STORAGE
  // ==========================================

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        setUser(parsedUser);

        setFormData({
          FullName: parsedUser.FullName || "",
          email: parsedUser.email || "",
          MobileNumber: parsedUser.MobileNumber || "",
        });
      } catch (error) {
        console.error("Error reading user:", error);
      }
    }
  }, []);


  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Full name - letters and spaces only
    if (name === "FullName") {
      const sanitized = value.replace(/[^a-zA-Z\s]/g, "");

      setFormData((prev) => ({
        ...prev,
        FullName: sanitized,
      }));

      return;
    }


    // Mobile - numbers only, maximum 10 digits
    if (name === "MobileNumber") {
      const sanitized = value
        .replace(/\D/g, "")
        .slice(0, 10);

      setFormData((prev) => ({
        ...prev,
        MobileNumber: sanitized,
      }));

      return;
    }


    // Email
    if (name === "email") {
      setFormData((prev) => ({
        ...prev,
        email: value,
      }));

      return;
    }
  };


  // ==========================================
  // EDIT BUTTON
  // ==========================================

  const handleEdit = () => {
    setIsEditing(true);

    setTimeout(() => {
      fullNameRef.current?.focus();
    }, 0);
  };


  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancel = () => {
    setFormData({
      FullName: user?.FullName || "",
      email: user?.email || "",
      MobileNumber: user?.MobileNumber || "",
    });

    setErrorMessage("");

    setIsEditing(false);
  };


  // ==========================================
  // UPDATE PROFILE
  // ==========================================

  const handleUpdate = async () => {
    setErrorMessage("");

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!formData.FullName.trim()) {
      setErrorMessage("Full name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }

    if (
      formData.MobileNumber &&
      formData.MobileNumber.length !== 10
    ) {
      setErrorMessage(
        "Mobile number must contain 10 digits."
      );
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", {
          replace: true,
        });

        return;
      }


      // ==========================================
      // CHECK EMAIL CHANGE
      // ==========================================

      const emailChanged =
        formData.email.trim().toLowerCase() !==
        user?.email?.trim().toLowerCase();


      // ==========================================
      // CASE 1
      // EMAIL CHANGED
      // ==========================================

      if (emailChanged) {

        const response = await API.post(
          "/profile/profile/email-change",
          {
            newEmail: formData.email.trim(),
          }
        );

        console.log(
          "EMAIL CHANGE RESPONSE:",
          response.data
        );


        // Save pending profile details temporarily
        localStorage.setItem(
          "pendingProfileData",
          JSON.stringify({
            FullName: formData.FullName,
            MobileNumber: formData.MobileNumber,
            email: formData.email,
          })
        );


        // Go OTP page
        navigate("/verify-otp", {
          state: {
            email: formData.email,
            isEmailUpdate: true,
          },
        });

        return;
      }


      // ==========================================
      // CASE 2
      // EMAIL NOT CHANGED
      // ==========================================

      const response = await API.put(
        "/profile/profile/update",
        {
          FullName: formData.FullName,
          MobileNumber: formData.MobileNumber,
        }
      );

      console.log(
        "PROFILE UPDATE RESPONSE:",
        response.data
      );


      const updatedUser =
        response.data.user || response.data;


      // ==========================================
      // UPDATE STATE
      // ==========================================

      setUser(updatedUser);


      // ==========================================
      // UPDATE LOCAL STORAGE
      // ==========================================

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );


      // ==========================================
      // UPDATE FORM
      // ==========================================

      setFormData({
        FullName: updatedUser.FullName || "",
        email: updatedUser.email || "",
        MobileNumber:
          updatedUser.MobileNumber || "",
      });

      setIsEditing(false);

      alert("Profile updated successfully!");

    } catch (error) {
      console.error(
        "PROFILE UPDATE ERROR:",
        error
      );

      setErrorMessage(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update profile."
      );

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // NO USER
  // ==========================================

  if (!user) {
    return (
      <div className="profile-page">

        <h2 className="profile-title">
          Profile
        </h2>

        <p>
          User details not available.
        </p>

      </div>
    );
  }


  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="profile-page">

      <h2 className="profile-title">

        Welcome{" "}

        <span>
          {formData.FullName || "User"}
        </span>

        !

      </h2>


      <div className="profile-card">

        {/* ==================================
            FULL NAME
        ================================== */}

        <div className="profile-field">

          <label htmlFor="FullName">
            Full Name
          </label>

          <input
            id="FullName"
            ref={fullNameRef}
            type="text"
            name="FullName"
            value={formData.FullName}
            onChange={handleChange}
            readOnly={!isEditing}
            className={
              isEditing
                ? "editable-input"
                : ""
            }
          />

        </div>


        {/* ==================================
            EMAIL
        ================================== */}

        <div className="profile-field">

          <label htmlFor="email">
            Email
          </label>

          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            readOnly={!isEditing}
            className={
              isEditing
                ? "editable-input"
                : ""
            }
          />

        </div>


        {/* ==================================
            MOBILE
        ================================== */}

        <div className="profile-field">

          <label htmlFor="MobileNumber">
            Phone
          </label>

          <input
            id="MobileNumber"
            type="text"
            name="MobileNumber"
            value={formData.MobileNumber}
            onChange={handleChange}
            readOnly={!isEditing}
            placeholder={
              isEditing
                ? "Enter 10-digit number"
                : ""
            }
            className={
              isEditing
                ? "editable-input"
                : ""
            }
          />

        </div>


        {/* ==================================
            ERROR
        ================================== */}

        {errorMessage && (
          <p
            className="profile-error"
            role="alert"
          >
            {errorMessage}
          </p>
        )}


        {/* ==================================
            BUTTONS
        ================================== */}

        {!isEditing ? (

          <button
            type="button"
            className="edit-profile-btn"
            onClick={handleEdit}
          >
            EDIT
          </button>

        ) : (

          <div className="profile-button-group">

            <button
              type="button"
              className="edit-profile-btn"
              onClick={handleUpdate}
              disabled={loading}
            >
              {loading
                ? "UPDATING..."
                : "UPDATE"}
            </button>

            <button
              type="button"
              className="cancel-profile-btn"
              onClick={handleCancel}
              disabled={loading}
            >
              CANCEL
            </button>

          </div>

        )}

      </div>

    </div>
  );
}

export default Profile;