import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Search,
  Edit,
  Trash2,
  Bell,
  Mail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import API from "../Api/axios";

import "./Offer.css";


const Offer = () => {

  const navigate = useNavigate();


  /* ==========================================
     OFFERS
  ========================================== */

  const [offers, setOffers] = useState([]);


  /* ==========================================
     SEARCH
  ========================================== */

  const [search, setSearch] = useState("");


  /* ==========================================
     LOADING
  ========================================== */

  const [loading, setLoading] = useState(true);


  /* ==========================================
     ERROR
  ========================================== */

  const [error, setError] = useState("");


  /* ==========================================
     PAGINATION
  ========================================== */

  const [currentPage, setCurrentPage] = useState(1);

  const offersPerPage = 6;


  /* ==========================================
     DELETE POPUP
  ========================================== */

  const [deletePopup, setDeletePopup] = useState({
    show: false,
    offerId: null,
  });


  /* ==========================================
     SUCCESS POPUP
  ========================================== */

  const [successPopup, setSuccessPopup] = useState({
    show: false,
    title: "",
    message: "",
  });


  /* ==========================================
     ERROR POPUP
  ========================================== */

  const [errorPopup, setErrorPopup] = useState({
    show: false,
    title: "",
    message: "",
  });


  /* ==========================================
     FETCH OFFERS
  ========================================== */

  const fetchOffers = async () => {

    try {

      setLoading(true);
      setError("");


      const response = await API.get(
        "/admin/offers"
      );


      console.log(
        "OFFER RESPONSE:",
        response.data
      );


      let offerData = [];


      if (Array.isArray(response.data)) {

        offerData = response.data;

      } else if (
        Array.isArray(response.data?.data)
      ) {

        offerData = response.data.data;

      } else if (
        Array.isArray(response.data?.offers)
      ) {

        offerData = response.data.offers;

      }


      setOffers(offerData);


    } catch (err) {

      console.error(
        "GET OFFERS ERROR:",
        err
      );


      setOffers([]);


      setError(
        err.response?.data?.message ||
        "Failed to load offers"
      );

    } finally {

      setLoading(false);

    }

  };


  /* ==========================================
     LOAD OFFERS
  ========================================== */

  useEffect(() => {

    fetchOffers();

  }, []);


  /* ==========================================
     OFFER NAME
  ========================================== */

  const getOfferName = (offer) => {

    return (
      offer.offername ||
      offer.offerName ||
      offer.name ||
      offer.title ||
      "-"
    );

  };


  /* ==========================================
     OFFER TYPE
  ========================================== */

  const getOfferType = (offer) => {

    return (
      offer.offertype ||
      offer.offerType ||
      offer.type ||
      offer.offer_type ||
      "-"
    );

  };


  /* ==========================================
     DISCOUNT
  ========================================== */

  const getDiscount = (offer) => {

    const type = String(
      offer.discounttype ||
      offer.discountType ||
      offer.discount_type ||
      ""
    ).toLowerCase();


    const value =
      offer.discountvalue ??
      offer.discountValue ??
      offer.discount ??
      "";


    if (value === "") {

      return "-";

    }


    if (
      type === "percentage" ||
      type === "percent"
    ) {

      return `${value}% OFF`;

    }


    if (
      type === "fixed" ||
      type === "amount"
    ) {

      return `₹${value} OFF`;

    }


    if (
      typeof value === "string" &&
      value.toLowerCase().includes("off")
    ) {

      return value;

    }


    return `${value} OFF`;

  };


  /* ==========================================
     VALID FROM
  ========================================== */

  const getValidFrom = (offer) => {

    const date =
      offer.valid_from ||
      offer.validFrom ||
      offer.startDate;


    if (!date) {

      return "-";

    }


    const parsedDate = new Date(date);


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {

      return "-";

    }


    return parsedDate.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  };


  /* ==========================================
     VALID TO
  ========================================== */

  const getValidTo = (offer) => {

    const date =
      offer.valid_to ||
      offer.validTo ||
      offer.endDate;


    if (!date) {

      return "-";

    }


    const parsedDate = new Date(date);


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {

      return "-";

    }


    return parsedDate.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  };


  /* ==========================================
     OFFER STATUS
  ========================================== */

  const getOfferStatus = (offer) => {

    /*
      Backend status
    */

    if (offer.status) {

      const backendStatus =
        String(
          offer.status
        ).toLowerCase();


      if (
        backendStatus === "inactive"
      ) {

        return "Expired";

      }


      if (
        backendStatus === "upcoming"
      ) {

        return "Upcoming";

      }


      if (
        backendStatus === "expired"
      ) {

        return "Expired";

      }


      if (
        backendStatus === "active"
      ) {

        return "Active";

      }

    }


    /*
      Calculate status using dates
    */

    const validFrom =
      offer.valid_from ||
      offer.validFrom ||
      offer.startDate;


    const validTo =
      offer.valid_to ||
      offer.validTo ||
      offer.endDate;


    if (
      !validFrom ||
      !validTo
    ) {

      return "Active";

    }


    const now = new Date();

    const from = new Date(
      validFrom
    );

    const to = new Date(
      validTo
    );


    if (
      Number.isNaN(
        from.getTime()
      ) ||
      Number.isNaN(
        to.getTime()
      )
    ) {

      return "Active";

    }


    if (now < from) {

      return "Upcoming";

    }


    if (now > to) {

      return "Expired";

    }


    return "Active";

  };


  /* ==========================================
     SEARCH
  ========================================== */

  const filteredOffers = useMemo(() => {

    const searchValue =
      search
        .trim()
        .toLowerCase();


    if (!searchValue) {

      return offers;

    }


    return offers.filter(
      (offer) =>
        getOfferName(
          offer
        )
          .toLowerCase()
          .includes(searchValue)
    );

  }, [
    offers,
    search,
  ]);


  /* ==========================================
     RESET PAGE WHEN SEARCH CHANGES
  ========================================== */

  useEffect(() => {

    setCurrentPage(1);

  }, [search]);


  /* ==========================================
     STATISTICS
  ========================================== */

  const totalOffers =
    offers.length;


  const activeOffers =
    offers.filter(
      (offer) =>
        getOfferStatus(
          offer
        ) === "Active"
    ).length;


  const upcomingOffers =
    offers.filter(
      (offer) =>
        getOfferStatus(
          offer
        ) === "Upcoming"
    ).length;


  const expiredOffers =
    offers.filter(
      (offer) =>
        getOfferStatus(
          offer
        ) === "Expired"
    ).length;


  /* ==========================================
     PAGINATION
  ========================================== */

  const totalPages = Math.max(
    2,
    Math.ceil(
      filteredOffers.length /
      offersPerPage
    )
  );


  const startIndex =
    (currentPage - 1) *
    offersPerPage;


  const currentOffers =
    filteredOffers.slice(
      startIndex,
      startIndex + offersPerPage
    );


  /* ==========================================
     GO TO PAGE
  ========================================== */

  const goToPage = (page) => {

    if (
      page < 1 ||
      page > totalPages
    ) {

      return;

    }


    setCurrentPage(page);

  };


  /* ==========================================
     EDIT
  ========================================== */

  const handleEdit = (offer) => {

    console.log(
      "EDIT OFFER:",
      offer
    );


    console.log(
      "EDIT OFFER ID:",
      offer?._id
    );


    if (
      !offer ||
      !offer._id
    ) {

      setErrorPopup({
        show: true,
        title: "Error",
        message:
          "Offer ID not found",
      });

      return;

    }


    navigate(
      `/admin/offer/edit/${offer._id}`
    );

  };


  /* ==========================================
     DELETE
  ========================================== */

  const handleDelete = (offerId) => {

    console.log(
      "DELETE OFFER ID:",
      offerId
    );


    if (!offerId) {

      setErrorPopup({
        show: true,
        title: "Error",
        message:
          "Offer ID not found",
      });

      return;

    }


    setDeletePopup({
      show: true,
      offerId: offerId,
    });

  };


  /* ==========================================
     CANCEL DELETE
  ========================================== */

  const cancelDelete = () => {

    setDeletePopup({
      show: false,
      offerId: null,
    });

  };


  /* ==========================================
     CONFIRM DELETE
  ========================================== */

  const confirmDelete = async () => {

    const offerId =
      deletePopup.offerId;


    if (!offerId) {

      return;

    }


    try {

      await API.delete(
        `/admin/offers/${offerId}`
      );


      setOffers(
        (previousOffers) =>
          previousOffers.filter(
            (offer) =>
              offer._id !==
              offerId
          )
      );


      setDeletePopup({
        show: false,
        offerId: null,
      });


      setSuccessPopup({
        show: true,
        title: "Success",
        message:
          "Offer deleted successfully",
      });


      /*
        Move back if the current page
        becomes empty.
      */

      const remainingOffers =
        filteredOffers.length - 1;


      const remainingPages =
        Math.max(
          2,
          Math.ceil(
            remainingOffers /
            offersPerPage
          )
        );


      if (
        currentPage >
        remainingPages
      ) {

        setCurrentPage(
          remainingPages
        );

      }


    } catch (err) {

      console.error(
        "DELETE OFFER ERROR:",
        err
      );


      setDeletePopup({
        show: false,
        offerId: null,
      });


      setErrorPopup({
        show: true,
        title: "Error",
        message:
          err.response?.data?.message ||
          "Failed to delete offer",
      });

    }

  };


  /* ==========================================
     CLOSE SUCCESS
  ========================================== */

  const closeSuccessPopup = () => {

    setSuccessPopup({
      show: false,
      title: "",
      message: "",
    });

  };


  /* ==========================================
     CLOSE ERROR
  ========================================== */

  const closeErrorPopup = () => {

    setErrorPopup({
      show: false,
      title: "",
      message: "",
    });

  };


  return (

    <div className="offer-page">


      {/* =====================================
          TOP BAR
      ===================================== */}

     


      {/* =====================================
          CONTENT
      ===================================== */}

      <div className="offer-content">


        {/* =====================================
            STAT CARDS
        ===================================== */}

        <div className="offer-stat-container">


          <div className="offer-stat-card total">

            <span>
              Total Offer
            </span>

            <strong>
              {totalOffers}
            </strong>

          </div>


          <div className="offer-stat-card active">

            <span>
              Active Offers
            </span>

            <strong>
              {activeOffers}
            </strong>

          </div>


          <div className="offer-stat-card upcoming">

            <span>
              Up Coming
            </span>

            <strong>
              {upcomingOffers}
            </strong>

          </div>


          <div className="offer-stat-card expired">

            <span>
              Expired Offers
            </span>

            <strong>
              {expiredOffers}
            </strong>

          </div>


        </div>


        {/* =====================================
            ERROR
        ===================================== */}

        {error && (

          <div className="offer-error">

            {error}

          </div>

        )}


        {/* =====================================
            TOOLBAR
        ===================================== */}

        <div className="offer-toolbar">


          <div className="offer-search">

            <Search size={22} />

            <input
              type="text"
              placeholder="search offer by name ..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>


          <button
            type="button"
            className="create-offer-btn"
            onClick={() =>
              navigate(
                "/admin/offer/add"
              )
            }
          >
            Create Offer
          </button>


        </div>


        {/* =====================================
            TABLE
        ===================================== */}

        {loading ? (

          <div className="offer-loading">

            Loading offers...

          </div>

        ) : (

          <div className="offer-table-wrapper">

            <table className="offer-table">


              <thead>

                <tr>

                  <th>
                    Offer Name
                  </th>

                  <th>
                    Offer Type
                  </th>

                  <th>
                    Discount
                  </th>

                  <th>
                    Valid From
                  </th>

                  <th>
                    Valid To
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>


                {currentOffers.length > 0 ? (

                  currentOffers.map(
                    (offer) => {

                      const status =
                        getOfferStatus(
                          offer
                        );


                      return (

                        <tr
                          key={
                            offer._id
                          }
                        >


                          <td>
                            {getOfferName(
                              offer
                            )}
                          </td>


                          <td>
                            {getOfferType(
                              offer
                            )}
                          </td>


                          <td>
                            {getDiscount(
                              offer
                            )}
                          </td>


                          <td>
                            {getValidFrom(
                              offer
                            )}
                          </td>


                          <td>
                            {getValidTo(
                              offer
                            )}
                          </td>


                          <td>

                            <span
                              className={
                                `offer-status ${
                                  status.toLowerCase()
                                }`
                              }
                            >
                              {status}
                            </span>

                          </td>


                          <td>

                            <div className="offer-actions">


                              {/* EDIT */}

                              <button
                                type="button"
                                className="offer-edit-btn"
                                title="Edit Offer"
                                onClick={() =>
                                  handleEdit(
                                    offer
                                  )
                                }
                              >

                                <Edit
                                  size={18}
                                />

                              </button>


                              {/* DELETE */}

                              <button
                                type="button"
                                className="offer-delete-btn"
                                title="Delete Offer"
                                onClick={() =>
                                  handleDelete(
                                    offer._id
                                  )
                                }
                              >

                                <Trash2
                                  size={18}
                                />

                              </button>


                            </div>

                          </td>


                        </tr>

                      );

                    }
                  )

                ) : (

                  <tr>

                    <td
                      colSpan="7"
                      className="offer-no-data"
                    >
                      No offers found
                    </td>

                  </tr>

                )}


              </tbody>


            </table>

          </div>

        )}


        {/* =====================================
            PAGINATION
        ===================================== */}

        {!loading && (

          <div className="offer-pagination">


            {/* PREVIOUS */}

            <button
              type="button"
              className="pagination-arrow"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                goToPage(
                  currentPage - 1
                )
              }
            >

              <ChevronLeft
                size={14}
              />

              <span>
                Previous
              </span>

            </button>


            {/* PAGE NUMBERS */}

            {Array.from(
              {
                length: totalPages,
              },
              (_, index) => {

                const page =
                  index + 1;


                return (

                  <button
                    key={page}
                    type="button"
                    className={
                      `pagination-number ${
                        currentPage === page
                          ? "selected"
                          : ""
                      }`
                    }
                    onClick={() =>
                      goToPage(
                        page
                      )
                    }
                  >

                    {page}

                  </button>

                );

              }
            )}


            {/* NEXT */}

            <button
              type="button"
              className="pagination-arrow"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                goToPage(
                  currentPage + 1
                )
              }
            >

              <span>
                Next
              </span>

              <ChevronRight
                size={14}
              />

            </button>


          </div>

        )}


        {/* =====================================
            FOOTER
        ===================================== */}

        <footer className="offer-footer">

          <span>
            © 2025
          </span>

          <span>
            Get All rights reserved. The Code is made with ♥ in India
          </span>

        </footer>


      </div>


      {/* =====================================
          DELETE POPUP
      ===================================== */}

      {deletePopup.show && (

        <div className="coupon-modal-overlay">

          <div className="coupon-modal">


            <div className="coupon-modal-icon delete-icon">
              !
            </div>


            <h2>
              Delete Offer?
            </h2>


            <p>
              Are you sure you want to
              delete this offer?
            </p>


            <div className="coupon-modal-actions">


              <button
                type="button"
                className="modal-cancel-btn"
                onClick={
                  cancelDelete
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="modal-delete-btn"
                onClick={
                  confirmDelete
                }
              >
                Yes, Delete
              </button>


            </div>


          </div>

        </div>

      )}


      {/* =====================================
          SUCCESS POPUP
      ===================================== */}

      {successPopup.show && (

        <div className="coupon-modal-overlay">

          <div className="coupon-modal">


            <div className="coupon-modal-icon success-icon">
              ✓
            </div>


            <h2>
              {successPopup.title}
            </h2>


            <p>
              {successPopup.message}
            </p>


            <div className="coupon-modal-actions">

              <button
                type="button"
                className="modal-success-btn"
                onClick={
                  closeSuccessPopup
                }
              >
                OK
              </button>

            </div>


          </div>

        </div>

      )}


      {/* =====================================
          ERROR POPUP
      ===================================== */}

      {errorPopup.show && (

        <div className="coupon-modal-overlay">

          <div className="coupon-modal">


            <div className="coupon-modal-icon delete-icon">
              !
            </div>


            <h2>
              {errorPopup.title}
            </h2>


            <p>
              {errorPopup.message}
            </p>


            <div className="coupon-modal-actions">

              <button
                type="button"
                className="modal-success-btn"
                onClick={
                  closeErrorPopup
                }
              >
                OK
              </button>

            </div>


          </div>

        </div>

      )}


    </div>

  );

};


export default Offer;