import Sidebar from "../combonent/sidebar";
import TopNavbar from "../combonent/navbar";
import { Outlet } from "react-router-dom";
import "./adminlayout.css";

const Adminlayout = () => {

  return (
    <div className="admin-layout">

      <Sidebar />

      <div className="admin-main">

        <TopNavbar />

        <main className="admin-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default Adminlayout;