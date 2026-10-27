import React, {
  useRef,
  useState,
  useEffect,
} from "react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

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
  {
    name: "My Profile",
    path: "/profile",
    icon: <FaUser />,
  },

  {
    name: "My Address",
    path: "/profile/address",
    icon: <FaLocationArrow />,
  },

  {
    name: "My Order",
    path: "/profile/myorder",
    icon: <FaShoppingBag />,
  },

  {
    name: "My Wishlist",
    path: "/wishlist",
    icon: <FaHeart />,
  },

  {
    name: "My Wallet",
    path: "/profile/wallet",
    icon: <FaWallet />,
  },

  {
    name: "My Coupon",
    path: "/profile/coupon",
    icon: <FaTicketAlt />,
  },

  {
    name: "Change password",
    path: "/profile/changepassword",
    icon: <FaLock />,
  },
];


// ==========================================
// SIDEBAR
// ==========================================

function Sidebar() {
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState(null);

  const [userName, setUserName] = useState("User");

  const [
    showPhotoOptions,
    setShowPhotoOptions,
  ] = useState(false);

  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);


  // ==========================================
  // LOAD PROFILE
  // ==========================================

  useEffect(() => {
    const loadProfile = async () => {
      try {

        // ======================================
        // FIRST GET LOCAL STORAGE USER
        // ======================================

        const storedUser =
          localStorage.getItem("user");

        if (storedUser) {
          try {

            const user =
              JSON.parse(storedUser);

            setUserName(
              user?.FullName ||
                user?.fullName ||
                user?.name ||
                "User"
            );

            if (user?.profileImage) {
              setProfileImage(
                user.profileImage
              );
            }

          } catch (error) {

            console.error(
              "LOCAL USER ERROR:",
              error
            );

          }
        }


        // ======================================
        // GET PROFILE FROM BACKEND
        // ======================================

        const response =
          await API.get("/auth/profile");

        console.log(
          "PROFILE RESPONSE:",
          response.data
        );

        const user =
          response?.data;

        if (!user) {
          return;
        }


        // ======================================
        // SET USER NAME
        // ======================================

        setUserName(
          user?.FullName ||
            user?.fullName ||
            user?.name ||
            "User"
        );


        // ======================================
        // SET PROFILE IMAGE
        // ======================================

        if (user?.profileImage) {
          setProfileImage(
            user.profileImage
          );
        } else {
          setProfileImage(null);
        }


        // ======================================
        // UPDATE LOCAL STORAGE
        // ======================================

        const oldUser =
          localStorage.getItem("user");

        let localUser = {};

        try {

          localUser = oldUser
            ? JSON.parse(oldUser)
            : {};

        } catch {

          localUser = {};

        }

        localUser = {
          ...localUser,
          _id: user._id,
          FullName: user.FullName,
          email: user.email,
          MobileNumber:
            user.MobileNumber,
          profileImage:
            user.profileImage || null,
        };

        localStorage.setItem(
          "user",
          JSON.stringify(localUser)
        );

      } catch (error) {

        console.error(
          "GET PROFILE ERROR:",
          error
        );

      }
    };

    loadProfile();

  }, []);


  // ==========================================
  // IMAGE CHANGE
  // ==========================================

  const handleImageChange = (event) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }


    // ========================================
    // FILE TYPE CHECK
    // ========================================

    if (!file.type.startsWith("image/")) {

      alert(
        "Please select an image file."
      );

      return;
    }


    // ========================================
    // FILE SIZE CHECK
    // ========================================

    if (file.size > 5 * 1024 * 1024) {

      alert(
        "Image must be smaller than 5 MB."
      );

      return;
    }


    const reader =
      new FileReader();

    reader.onloadend = async () => {

      const base64Image =
        reader.result;

      try {

        setUploading(true);


        // ======================================
        // UPDATE PROFILE IMAGE
        // ======================================

        const response =
          await API.put(
            "/auth/profile/update",
            {
              profileImage:
                base64Image,
            }
          );

        console.log(
          "PROFILE IMAGE UPDATE RESPONSE:",
          response.data
        );


        // ======================================
        // GET UPDATED USER
        // ======================================

        const updatedUser =
          response?.data?.user;

        const savedImage =
          updatedUser?.profileImage;


        // ======================================
        // SET IMAGE
        // ======================================

        if (savedImage) {

          setProfileImage(
            savedImage
          );


          // ====================================
          // UPDATE LOCAL STORAGE
          // ====================================

          const storedUser =
            localStorage.getItem(
              "user"
            );

          let localUser = {};

          try {

            localUser =
              storedUser
                ? JSON.parse(
                    storedUser
                  )
                : {};

          } catch {

            localUser = {};

          }

          localUser.profileImage =
            savedImage;

          if (updatedUser?.FullName) {
            localUser.FullName =
              updatedUser.FullName;
          }

          if (updatedUser?.MobileNumber) {
            localUser.MobileNumber =
              updatedUser.MobileNumber;
          }

          localStorage.setItem(
            "user",
            JSON.stringify(
              localUser
            )
          );

          console.log(
            "PROFILE IMAGE SAVED"
          );

        }


        setShowPhotoOptions(false);

        alert(
          "Profile picture updated successfully!"
        );

      } catch (error) {

        console.error(
          "PROFILE IMAGE UPDATE ERROR:",
          error
        );

        console.error(
          "STATUS:",
          error?.response?.status
        );

        console.error(
          "DATA:",
          error?.response?.data
        );

        alert(
          error?.response?.data?.message ||
            "Failed to save profile picture"
        );

      } finally {

        setUploading(false);

      }

    };

    reader.readAsDataURL(file);


    // Reset input so same file can be selected again
    event.target.value = "";

  };


  // ==========================================
  // ADD PHOTO
  // ==========================================

  const handleAddPhoto = () => {

    if (uploading) {
      return;
    }

    fileInputRef.current?.click();

  };


  // ==========================================
  // REMOVE PHOTO
  // ==========================================

  const handleRemovePhoto = async () => {

    try {

      setUploading(true);


      // ======================================
      // REMOVE FROM DATABASE
      // ======================================

      const response =
        await API.delete(
          "/auth/removeprofile",
          {
            profileImage: null,
          }
        );

      console.log(
        "REMOVE PROFILE IMAGE RESPONSE:",
        response.data
      );


      // ======================================
      // REMOVE FROM STATE
      // ======================================

      setProfileImage(null);

      setShowPhotoOptions(false);


      // ======================================
      // UPDATE LOCAL STORAGE
      // ======================================

      const storedUser =
        localStorage.getItem(
          "user"
        );

      if (storedUser) {

        try {

          const user =
            JSON.parse(
              storedUser
            );

          user.profileImage =
            null;

          localStorage.setItem(
            "user",
            JSON.stringify(user)
          );

        } catch (error) {

          console.error(
            "LOCAL STORAGE UPDATE ERROR:",
            error
          );

        }

      }

    } catch (error) {

      console.error(
        "REMOVE PROFILE IMAGE ERROR:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to remove profile picture"
      );

    } finally {

      setUploading(false);

    }

  };


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {

    // IMPORTANT:
    // Do NOT clear token here.
    // First open the logout confirmation page.

    navigate("logout");

  };


  // ==========================================
  // UI
  // ==========================================

  return (
    <aside className="profile-sidebar">

      {/* =====================================
          PROFILE HEADER
      ====================================== */}

      <div className="sidebar-profile">

        <div className="sidebar-avatar-wrapper">

          {/* ==================================
              AVATAR BUTTON
          ================================== */}

          <button
            type="button"
            className="sidebar-avatar-button"
            onClick={() =>
              setShowPhotoOptions(
                !showPhotoOptions
              )
            }
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


          {/* ==================================
              PHOTO OPTIONS
          ================================== */}

          {showPhotoOptions && (

            <div className="photo-options">

              {/* ADD / CHANGE */}

              <button
                type="button"
                onClick={
                  handleAddPhoto
                }
                disabled={uploading}
              >

                <FaCamera />

                {uploading
                  ? "Saving..."
                  : profileImage
                  ? "Change Photo"
                  : "Add Photo"}

              </button>


              {/* REMOVE */}

              {profileImage && (

                <button
                  type="button"
                  className="remove-photo"
                  onClick={
                    handleRemovePhoto
                  }
                  disabled={uploading}
                >

                  <FaTrash />

                  Remove Photo

                </button>

              )}

            </div>

          )}


          {/* ==================================
              HIDDEN FILE INPUT
          ================================== */}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={
              handleImageChange
            }
            style={{
              display: "none",
            }}
          />

        </div>


        {/* ====================================
            USER NAME
        ===================================== */}

        <div className="sidebar-user-name">

          <span>
            {userName}
          </span>

        </div>

      </div>


      {/* =====================================
          MENU
      ====================================== */}

      <nav className="sidebar-menu">

        {menuItems.map(
          (item) => (

            <NavLink
              key={item.path}
              to={item.path}
              end={
                item.path ===
                "/profile"
              }
              className={({
                isActive,
              }) =>
                `sidebar-menu-item ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >

              <span className="sidebar-icon">

                {item.icon}

              </span>

              <span className="sidebar-text">

                {item.name}

              </span>

              {item.count && (

                <span className="wishlist-count">

                  ({item.count})

                </span>

              )}

            </NavLink>

          )
        )}


        {/* ==================================
            LOGOUT
        ================================== */}

        <button
          type="button"
          className="sidebar-menu-item sidebar-logout"
          onClick={handleLogout}
        >

          <span className="sidebar-icon">

            <FaSignOutAlt />

          </span>

          <span className="sidebar-text">

            Log out

          </span>

        </button>


        {/* ==================================
            REFERRAL
        ================================== */}

        <NavLink
          to="/profile/referral"
          className={({
            isActive,
          }) =>
            `sidebar-menu-item ${
              isActive
                ? "active"
                : ""
            }`
          }
        >

          <span className="sidebar-icon">

            <FaUsers />

          </span>

          <span className="sidebar-text">

            Referral Code

          </span>

        </NavLink>

      </nav>

    </aside>
  );
}

export default Sidebar;