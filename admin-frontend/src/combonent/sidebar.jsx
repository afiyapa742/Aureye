import logo from "../assets/logo.png";
import "./sidebar.css";

import { Link } from "react-router-dom";

const Sidebar = () => {
  const handleLogout = () => {
    // Clear admin login state
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("token");
    sessionStorage.clear();

    // Redirect to login and replace current history entry
    window.location.replace("/login");
  };
  return (
    <div className="sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        <img src={logo} alt="CAI Logo" />
      </div>


      {/* Menu */}
      <nav className="sidebar-menu">

        <Link to="/admin">
          Dashboard
        </Link>

        <Link to="/admin/product">
          Product
        </Link>

        <Link to="/admin/orders">
          Orders
        </Link>

        <Link to="/admin/users">
          Users
        </Link>

        <Link to="/admin/categories">
          Categories
        </Link>

        <Link to="/admin/coupon">
           Coupons
        </Link>
<Link to="/admin/offer">
          Offers
        </Link>
        <Link to="/admin/inventory">
          Inventory
        </Link>

        <Link to="/admin/returnorder">
          ReturnOrder
        </Link>

        <Link to="/admin/material">
          Meterial
        </Link>
    <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          Logout
        </button>


      </nav>

    </div>
  );
};

export default Sidebar;