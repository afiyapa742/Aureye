import { Bell, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./navbar.css";

import {
  getprofile,
  profileupdate,
} from "../services/Authservice";


const TopNavbar = () => {

  const [admin, setAdmin] = useState(null);

  const fileInputRef = useRef(null);


  // ==========================
  // GET PROFILE
  // ==========================

  useEffect(() => {

    const fetchAdminProfile = async () => {

      try {

        const response = await getprofile(
          "ADM001"
        );

        console.log(
          "Admin profile:",
          response
        );

        setAdmin(response.admin);

      } catch (error) {

        console.log(
          "Profile fetch error:",
          error
        );

      }

    };

    fetchAdminProfile();

  }, []);


  // ==========================
  // IMAGE CHANGE
  // ==========================

  const handleProfileChange = (e) => {

    const file = e.target.files[0];

    if (!file) return;


    // FileReader
    const reader = new FileReader();


    reader.onloadend = async () => {

      const base64Image = reader.result;

      console.log(
        "Image converted:",
        base64Image
      );


      try {

        const response =
          await profileupdate(
            "ADM001",
            base64Image
          );


        console.log(
          "Profile updated:",
          response
        );


        // Update navbar image
        setAdmin(response.admin);


      } catch (error) {

        console.log(
          "Profile update error:",
          error
        );

      }

    };


    reader.readAsDataURL(file);
  };


  return (

    <div className="top-navbar">

      <div className="navbar-right">


        {/* Notification */}

        <button className="navbar-icon">

          <Bell size={20} />

        </button>


        {/* Mail */}

        <button className="navbar-icon">

          <Mail size={20} />

        </button>


        {/* Profile */}

        <div
          className="navbar-profile"
          onClick={() =>
            fileInputRef.current.click()
          }
        >

          <img
            src={
              admin?.profileImage ||
              "/profile.png"
            }
            alt="Admin Profile"
          />


          <div className="profile-info">

            <span className="profile-name">
              Admin
            </span>

          </div>

        </div>


        {/* Hidden file input */}

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{
            display: "none",
          }}
          onChange={handleProfileChange}
        />

      </div>

    </div>

  );
};


export default TopNavbar;