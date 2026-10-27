import React from "react";
import "./pagination.css";

const Pagination = ({ page, setPage, totalPages }) => {

  return (
    <div className="pagination">

      <button
        className="pagination-btn"
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
      >
        Previous
      </button>

      {Array.from(
        { length: totalPages },
        (_, index) => index + 1
      ).map((pageNumber) => (

        <button
          key={pageNumber}
          className={`pagination-btn ${
            page === pageNumber ? "active" : ""
          }`}
          onClick={() => setPage(pageNumber)}
        >
          {pageNumber}
        </button>

      ))}

      <button
        className="pagination-btn"
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
      >
        Next
      </button>

    </div>
  );
};

export default Pagination;