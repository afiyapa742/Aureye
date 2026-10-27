import { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import "./dashboard.css";

import { useUsers } from "../Hooks/user";
import DeletePopup from "../combonent/deletepop";


const Users = () => {

  // =========================
  // USERS HOOK
  // =========================

  const {
    users,
    loading,
    error,
    fetchUsers,
    changeUserStatus,
    deleteUser
  } = useUsers();


  // =========================
  // DELETE POPUP STATE
  // =========================

  const [selectedUser, setSelectedUser] = useState(null);


  // =========================
  // PAGINATION
  // =========================

  const [currentPage, setCurrentPage] = useState(1);

  const usersPerPage = 5;


  const totalPages = Math.ceil(
    users.length / usersPerPage
  );


  const indexOfLastUser =
    currentPage * usersPerPage;


  const indexOfFirstUser =
    indexOfLastUser - usersPerPage;


  const currentUsers =
    users.slice(
      indexOfFirstUser,
      indexOfLastUser
    );


  // =========================
  // CHART DATA (REAL DATA)
  // =========================

  // New users per month (last 6 months)

  const monthlyData = useMemo(() => {

    const now = new Date();

    const months = [];

    for (let i = 5; i >= 0; i--) {

      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: date.toLocaleString(
          "en-US",
          { month: "short" }
        ),
        users: 0
      });

    }

    users.forEach((user) => {

      if (!user.createdAt) {
        return;
      }

      const created =
        new Date(user.createdAt);

      if (isNaN(created.getTime())) {
        return;
      }

      const match = months.find(
        (m) =>
          m.year === created.getFullYear() &&
          m.month === created.getMonth()
      );

      if (match) {
        match.users += 1;
      }

    });

    return months;

  }, [users]);


  // Active vs Blocked

  const statusData = useMemo(() => {

    const blocked = users.filter(
      (user) => user.status === "BLOCKED"
    ).length;

    const active = users.length - blocked;

    return [
      { name: "Active", value: active },
      { name: "Blocked", value: blocked }
    ];

  }, [users]);


  const STATUS_COLORS = [
    "#16a34a",
    "#dc2626"
  ];


  // =========================
  // FETCH USERS
  // =========================

  useEffect(() => {

    fetchUsers();

  }, []);


  // =========================
  // RESET PAGE
  // =========================

  useEffect(() => {

    if (
      currentPage > totalPages &&
      totalPages > 0
    ) {

      setCurrentPage(totalPages);

    }

  }, [
    users.length,
    currentPage,
    totalPages
  ]);


  // =========================
  // BLOCK / UNBLOCK
  // =========================

  const handleStatusChange = async (user) => {

    const newStatus =
      user.status === "BLOCKED"
        ? "ACTIVE"
        : "BLOCKED";


    try {

      await changeUserStatus(
        user._id,
        newStatus
      );

    } catch (error) {

      console.log(
        "Status update error:",
        error
      );

      alert(
        error.response?.data?.message ||
        "Something went wrong"
      );

    }

  };


  // =========================
  // OPEN DELETE POPUP
  // =========================

  const handleDelete = (user) => {

    setSelectedUser(user);

  };


  // =========================
  // CONFIRM DELETE
  // =========================

  const confirmDelete = async () => {

    if (!selectedUser) {
      return;
    }


    try {

      await deleteUser(
        selectedUser._id
      );


      // Close popup

      setSelectedUser(null);


      console.log(
        "User deleted successfully"
      );


    } catch (error) {

      console.log(
        "User delete error:",
        error
      );


      alert(
        error.response?.data?.message ||
        "Failed to delete user"
      );

    }

  };


  // =========================
  // CANCEL DELETE
  // =========================

  const cancelDelete = () => {

    setSelectedUser(null);

  };


  // =========================
  // PAGE CHANGE
  // =========================

  const goToPage = (page) => {

    if (
      page >= 1 &&
      page <= totalPages
    ) {

      setCurrentPage(page);

    }

  };


  // =========================
  // PREVIOUS PAGE
  // =========================

  const previousPage = () => {

    if (currentPage > 1) {

      setCurrentPage(
        currentPage - 1
      );

    }

  };


  // =========================
  // NEXT PAGE
  // =========================

  const nextPage = () => {

    if (currentPage < totalPages) {

      setCurrentPage(
        currentPage + 1
      );

    }

  };


  // =========================
  // RETURN
  // =========================

  return (

    <div className="users-page">


      {/* =================================
          PAGE HEADER
      ================================= */}

      <div className="users-header">

        <h1>
          Users
        </h1>

        <p>
          Manage registered users
        </p>

      </div>



      {/* =================================
          CHARTS (REAL DATA)
      ================================= */}

      {!loading && !error && users.length > 0 && (

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "24px"
          }}
        >

          {/* NEW USERS PER MONTH */}

          <div
            className="users-box"
            style={{
              flex: "2 1 420px",
              minWidth: 0
            }}
          >

            <h2>
              New Users (Last 6 Months)
            </h2>

            <div
              style={{
                width: "100%",
                height: 260,
                marginTop: "16px"
              }}
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart data={monthlyData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis dataKey="label" />

                  <YAxis
                    allowDecimals={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="users"
                    name="New users"
                    fill="#1f2937"
                    radius={[6, 6, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>



          {/* ACTIVE VS BLOCKED */}

          <div
            className="users-box"
            style={{
              flex: "1 1 260px",
              minWidth: 0
            }}
          >

            <h2>
              Active vs Blocked
            </h2>

            <div
              style={{
                width: "100%",
                height: 260,
                marginTop: "16px"
              }}
            >

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >

                    {statusData.map(
                      (entry, index) => (

                        <Cell
                          key={entry.name}
                          fill={
                            STATUS_COLORS[index]
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>

      )}



      {/* =================================
          USERS BOX
      ================================= */}

      <div className="users-box">


        {/* =================================
            BOX HEADER
        ================================= */}

        <div className="users-box-header">

          <div>

            <h2>
              All Users
            </h2>

            <p>
              Total Users: {users.length}
            </p>

          </div>

        </div>



        {/* =================================
            LOADING
        ================================= */}

        {loading && (

          <p className="loading">
            Loading users...
          </p>

        )}



        {/* =================================
            ERROR
        ================================= */}

        {error && (

          <p className="error">
            {error}
          </p>

        )}



        {/* =================================
            TABLE
        ================================= */}

        {!loading && !error && (

          <div className="users-table-container">


            <table className="users-table">


              {/* =================================
                  TABLE HEADER
              ================================= */}

              <thead>

                <tr>

                  <th>
                    Name
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Mobile Number
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                  <th>
                    Delete
                  </th>

                </tr>

              </thead>



              {/* =================================
                  TABLE BODY
              ================================= */}

              <tbody>


                {/* NO USERS */}

                {users.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="no-users"
                    >

                      No users found

                    </td>

                  </tr>

                ) : (


                  /* USERS */

                  currentUsers.map((user) => (

                    <tr
                      key={user._id}
                    >


                      {/* =================================
                          NAME
                      ================================= */}

                      <td>

                        {user.FullName}

                      </td>



                      {/* =================================
                          EMAIL
                      ================================= */}

                      <td>

                        {user.email}

                      </td>



                      {/* =================================
                          MOBILE
                      ================================= */}

                      <td>

                        {user.MobileNumber || "-"}

                      </td>



                      {/* =================================
                          STATUS
                      ================================= */}

                      <td>

                        <span
                          className={
                            user.status === "BLOCKED"
                              ? "status blocked"
                              : "status active"
                          }
                        >

                          {user.status}

                        </span>

                      </td>



                      {/* =================================
                          BLOCK / UNBLOCK
                      ================================= */}

                      <td>

                        <button
                          type="button"

                          className={
                            user.status === "BLOCKED"
                              ? "unblock-btn"
                              : "block-btn"
                          }

                          onClick={() =>
                            handleStatusChange(user)
                          }
                        >

                          {user.status === "BLOCKED"
                            ? "Unblock"
                            : "Block"}

                        </button>

                      </td>



                      {/* =================================
                          DELETE
                      ================================= */}

                      <td>

                        <button
                          type="button"

                          className="delete-btn"

                          onClick={() =>
                            handleDelete(user)
                          }
                        >

                          Delete

                        </button>

                      </td>


                    </tr>

                  ))

                )}

              </tbody>

            </table>



            {/* =================================
                PAGINATION
            ================================= */}

            {totalPages > 1 && (

              <div className="users-pagination">


                {/* PREVIOUS */}

                <button
                  type="button"

                  className="pagination-arrow"

                  onClick={previousPage}

                  disabled={
                    currentPage === 1
                  }
                >

                  Previous

                </button>



                {/* PAGE NUMBERS */}

                <div className="pagination-numbers">

                  {Array.from(
                    {
                      length: totalPages
                    },
                    (_, index) =>
                      index + 1

                  ).map((page) => (

                    <button
                      key={page}

                      type="button"

                      className={
                        currentPage === page
                          ? "pagination-number active"
                          : "pagination-number"
                      }

                      onClick={() =>
                        goToPage(page)
                      }
                    >

                      {page}

                    </button>

                  ))}

                </div>



                {/* NEXT */}

                <button
                  type="button"

                  className="pagination-arrow"

                  onClick={nextPage}

                  disabled={
                    currentPage === totalPages
                  }
                >

                  Next

                </button>


              </div>

            )}


          </div>

        )}


      </div>



      {/* =================================
          PROFESSIONAL DELETE POPUP
      ================================= */}

      {selectedUser && (

        <DeletePopup

          user={selectedUser}

          onConfirm={confirmDelete}

          onCancel={cancelDelete}

        />

      )}


    </div>

  );

};


export default Users;