import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "./navbar.css"
function Navbar() {
  return (
    <nav className="navbar">

      {/* Logo */}
      <Link to="/" className="logo-link">
        <img
          src={logo}
          alt="Aureya Logo"
          className="logo"
        />
      </Link>

      {/* Links */}
      <div className="nav-links">
        <Link to="/home">Home</Link>
        <Link to="/about">About Us</Link>
      </div>

    </nav>
  );
}
export default Navbar;
