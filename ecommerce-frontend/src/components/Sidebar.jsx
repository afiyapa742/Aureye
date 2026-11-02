import React, { useRef, useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

import API from "../api/axios";

import {
  FaUser,
  FaLocationArrow,
  FaShoppingBag,
  FaHeart,
  FaWallet,
  FaTicketAlt,
  FaLock,
  FaSignOutAlt,
  FaUsers,
  FaCamera,
  FaTrash,
} from "react-icons/fa";

import "./Sidebar.css";

// ==========================================
// MENU ITEMS
// ==========================================

const menuItems = [
  { name: "My Profile", path: "/profile", icon: <FaUser /> },
  { name: "My Address", path: "/profile/address", icon: <FaLocationArrow /> },
  { name: "My Order", path: "/profile/myorder", icon: <FaShoppingBag /> },
  { name: "My Wishlist", path: "/wishlist", icon: <FaHeart /> },
  { name: "My Wallet", path: "/profile/wallet", icon: <FaWallet /> },
  { name: "My Coupon", path: "/profile/coupon", icon: <FaTicketAlt /> },
  {
    name: "Change password",
    path: "/profile/changepassword",
    icon: <FaLock />,
  },
];

// ==========================================
// LOCAL STORAGE HELPERS
// ==========================================

const readLocalUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveLocalUser = (data) => {
  localStorage.setItem("user", JSON.stringify({ ...readLocalUser(), ...data }));
};

// ==========================================
// SIDEBAR
// ==========================================

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState("User");
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Mobile menu
  const [menuOpen, setMenuOpen] = useState(false);

  const fileInputRef = useRef(null);

  // ==========================================
  // MOBILE MENU
  // ==========================================

  // Close the menu when the page changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Stop the page scrolling behind the open menu.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    setShowPhotoOptions(false);
  };

  // ==========================================
  // LOAD PROFILE
  // ==========================================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // First show the local storage user.
        const localUser = readLocalUser();

        if (localUser?.FullName || localUser?.fullName || localUser?.name) {
          setUserName(
            localUser.FullName ||
              localUser.fullName ||
              localUser.name ||
              "User"
          );
        }

        if (localUser?.profileImage) {
          setProfileImage(localUser.profileImage);
        }

        // Then get the latest profile from the backend.
        const response = await API.get("/auth/profile");
        const user = response?.data;

        if (!user) return;

        setUserName(user?.FullName || user?.fullName || user?.name || "User");

        setProfileImage(user?.profileImage || null);

        saveLocalUser({
          _id: user._id,
          FullName: user.FullName,
          email: user.email,
          MobileNumber: user.MobileNumber,
          profileImage: user.profileImage || null,
        });
      } catch (error) {
        console.error("GET PROFILE ERROR:", error);
      }
    };

    loadProfile();
  }, []);

  // ==========================================
  // IMAGE CHANGE
  // ==========================================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64Image = reader.result;

      try {
        setUploading(true);

        const response = await API.put("/auth/profile/update", {
          profileImage: base64Image,
        });

        const updatedUser = response?.data?.user;
        const savedImage = updatedUser?.profileImage;

        if (savedImage) {
          setProfileImage(savedImage);

          const updates = { profileImage: savedImage };

          if (updatedUser?.FullName) {
            updates.FullName = updatedUser.FullName;
          }

          if (updatedUser?.MobileNumber) {
            updates.MobileNumber = updatedUser.MobileNumber;
          }

          saveLocalUser(updates);
        }

        setShowPhotoOptions(false);

        alert("Profile picture updated successfully!");
      } catch (error) {
        console.error("PROFILE IMAGE UPDATE ERROR:", error);
        console.error("STATUS:", error?.response?.status);
        console.error("DATA:", error?.response?.data);

        alert(
          error?.response?.data?.message || "Failed to save profile picture"
        );
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again.
    event.target.value = "";
  };

  // ==========================================
  // ADD PHOTO
  // ==========================================

  const handleAddPhoto = () => {
    if (uploading) return;

    fileInputRef.current?.click();
  };

  // ==========================================
  // REMOVE PHOTO
  // ==========================================

  const handleRemovePhoto = async () => {
    try {
      setUploading(true);

      await API.delete("/auth/removeprofile");

      setProfileImage(null);
      setShowPhotoOptions(false);

      saveLocalUser({ profileImage: null });
    } catch (error) {
      console.error("REMOVE PROFILE IMAGE ERROR:", error);

      alert(
        error?.response?.data?.message || "Failed to remove profile picture"
      );
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // LOGOUT
  // IMPORTANT: do NOT clear the token here.
  // First open the logout confirmation page.
  // ==========================================

  const handleLogout = () => {
    closeMenu();
    navigate("logout");
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <>
      {/* Menu button (visible on mobile only) */}
      <button
        type="button"
        className="profile-menu-toggle"
        onClick={() => setMenuOpen(true)}
        aria-label="Open profile menu"
      >
        ☰ Menu
      </button>

      {/* Dark background behind the open menu (mobile only) */}
      {menuOpen && (
        <div className="profile-sidebar-overlay" onClick={closeMenu} />
      )}

      <aside className={`profile-sidebar ${menuOpen ? "open" : ""}`}>
        {/* Close button (visible on mobile only) */}
        <button
          type="button"
          className="profile-sidebar-close"
          onClick={closeMenu}
          aria-label="Close profile menu"
        >
          ×
        </button>

        {/* PROFILE HEADER */}

        <div className="sidebar-profile">
          <div className="sidebar-avatar-wrapper">
            {/* AVATAR BUTTON */}

            <button
              type="button"
              className="sidebar-avatar-button"
              onClick={() => setShowPhotoOptions(!showPhotoOptions)}
              disabled={uploading}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="sidebar-avatar-image"
                />
              ) : (
                <div className="sidebar-avatar">
                  <FaUser />
                </div>
              )}

              <span className="camera-icon">
                <FaCamera />
              </span>
            </button>

            {/* PHOTO OPTIONS */}

            {showPhotoOptions && (
              <div className="photo-options">
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  disabled={uploading}
                >
                  <FaCamera />

                  {uploading
                    ? "Saving..."
                    : profileImage
                    ? "Change Photo"
                    : "Add Photo"}
                </button>

                {profileImage && (
                  <button
                    type="button"
                    className="remove-photo"
                    onClick={handleRemovePhoto}
                    disabled={uploading}
                  >
                    <FaTrash />
                    Remove Photo
                  </button>
                )}
              </div>
            )}

            {/* HIDDEN FILE INPUT */}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </div>

          {/* USER NAME */}

          <div className="sidebar-user-name">
            <span>{userName}</span>
          </div>
        </div>

        {/* MENU */}

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/profile"}
              className={({ isActive }) =>
                `sidebar-menu-item ${isActive ? "active" : ""}`
              }
            >
              <span className="sidebar-icon">{item.icon}</span>

              <span className="sidebar-text">{item.name}</span>

              {item.count && (
                <span className="wishlist-count">({item.count})</span>
              )}
            </NavLink>
          ))}

          {/* LOGOUT */}

          <button
            type="button"
            className="sidebar-menu-item sidebar-logout"
            onClick={handleLogout}
          >
            <span className="sidebar-icon">
              <FaSignOutAlt />
            </span>

            <span className="sidebar-text">Log out</span>
          </button>

          {/* REFERRAL */}

          <NavLink
            to="/profile/referral"
            className={({ isActive }) =>
              `sidebar-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-icon">
              <FaUsers />
            </span>

            <span className="sidebar-text">Referral Code</span>
          </NavLink>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;