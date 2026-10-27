import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../Api/axios";

import "./Inventory.css";

const Inventory = () => {
  const [inventory, setInventory] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [stockFilter, setStockFilter] =
    useState("all");

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 5;

  /* ==========================================
     FETCH INVENTORY
  ========================================== */

  const fetchInventory = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await api.get(
        "/admin/inventory"
      );

      const data =
        response?.data?.data;

      setInventory(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "GET INVENTORY ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load inventory"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  /* ==========================================
     NORMALIZE DATA
  ========================================== */

  // Shows product name + variant details (size / color)
  const getProductName = (item) => {
    const name =
      item?.productName ||
      item?.product?.productName ||
      item?.productId?.productName ||
      item?.variantName ||
      "Product";

    const details = [
      item?.size && `Size ${item.size}`,
      item?.color,
    ]
      .filter(Boolean)
      .join(" / ");

    return details
      ? `${name} (${details})`
      : name;
  };

  const getStock = (item) => {
    return Number(
      item?.stock ??
        item?.quantity ??
        item?.variantId?.stock ??
        0
    );
  };

  const getLowAlert = (item) => {
    return Number(
      item?.lowAlert ??
        item?.lowStockAlert ??
        item?.lowStockLimit ??
        5
    );
  };

  const getCategory = (item) => {
    return (
      item?.categoryName ||
      item?.category?.Categoryname ||
      item?.category?.categoryName ||
      item?.productId?.categoryName ||
      item?.category ||
      "Uncategorized"
    );
  };

  const getStatus = (item) => {
    const stock =
      getStock(item);

    const lowAlert =
      getLowAlert(item);

    if (stock <= 0) {
      return "Out of Stock";
    }

    if (stock <= lowAlert) {
      return "Low stock";
    }

    return "In Stock";
  };

  /* ==========================================
     CATEGORIES
  ========================================== */

  const categories = useMemo(() => {
    const values =
      inventory.map((item) =>
        getCategory(item)
      );

    return [
      ...new Set(
        values.filter(Boolean)
      ),
    ];
  }, [inventory]);

  /* ==========================================
     STATISTICS
  ========================================== */

  const totalItems =
    inventory.length;

  const lowStock =
    inventory.filter(
      (item) =>
        getStock(item) > 0 &&
        getStock(item) <=
          getLowAlert(item)
    ).length;

  const outOfStock =
    inventory.filter(
      (item) =>
        getStock(item) <= 0
    ).length;

  /* ==========================================
     FILTER
  ========================================== */

  const filteredInventory =
    useMemo(() => {
      let result = [
        ...inventory,
      ];

      if (
        categoryFilter !== "all"
      ) {
        result =
          result.filter(
            (item) =>
              getCategory(item) ===
              categoryFilter
          );
      }

      if (
        stockFilter !== "all"
      ) {
        result =
          result.filter(
            (item) => {
              const status =
                getStatus(item);

              if (
                stockFilter ===
                "low"
              ) {
                return (
                  status ===
                  "Low stock"
                );
              }

              if (
                stockFilter ===
                "out"
              ) {
                return (
                  status ===
                  "Out of Stock"
                );
              }

              if (
                stockFilter ===
                "available"
              ) {
                return (
                  status ===
                  "In Stock"
                );
              }

              return true;
            }
          );
      }

      return result;
    }, [
      inventory,
      categoryFilter,
      stockFilter,
    ]);

  /* ==========================================
     PAGINATION
  ========================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredInventory.length /
          itemsPerPage
      )
    );

  const startIndex =
    (currentPage - 1) *
    itemsPerPage;

  const paginatedInventory =
    filteredInventory.slice(
      startIndex,
      startIndex +
        itemsPerPage
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    categoryFilter,
    stockFilter,
  ]);

  /* ==========================================
     EXPORT
  ========================================== */

  const handleExport = () => {
    if (
      filteredInventory.length ===
      0
    ) {
      return;
    }

    const header =
      [
        "Product",
        "Stock",
        "Low Alert",
        "Status",
      ];

    const rows =
      filteredInventory.map(
        (item) => [
          getProductName(item),
          getStock(item),
          getLowAlert(item),
          getStatus(item),
        ]
      );

    const csvContent = [
      header,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value)
              .replaceAll(
                '"',
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob =
      new Blob(
        [csvContent],
        {
          type: "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      "inventory.csv";

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      url
    );
  };

  /* ==========================================
     PAGE CHANGE
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
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="inventory-page">
        <div className="inventory-loading">
          Loading inventory...
        </div>
      </div>
    );
  }

  /* ==========================================
     RENDER
  ========================================== */

  return (
    <div className="inventory-page">

      <div className="inventory-container">

        {/* ==================================
            TITLE
        ================================== */}

        <div className="inventory-breadcrumb">

          <span>
            Reports/Inventory
          </span>

          <strong>
            Report
          </strong>

        </div>

        {/* ==================================
            STAT CARDS
        ================================== */}

        <div className="inventory-stats">

          <div className="inventory-stat-card">
            <span>
              Total Items:
            </span>

            <strong>
              {totalItems}
            </strong>
          </div>

          <div className="inventory-stat-card">
            <span>
              Low Stock
            </span>

            <strong>
              {lowStock}
            </strong>
          </div>

          <div className="inventory-stat-card">
            <span>
              Out of Stock
            </span>

            <strong>
              {outOfStock}
            </strong>
          </div>

        </div>

        {/* ==================================
            FILTERS
        ================================== */}

        <div className="inventory-filter-section">

          <h2>
            Filters
          </h2>

          <div className="inventory-filter-controls">

            <select
              value={
                categoryFilter
              }
              onChange={(e) =>
                setCategoryFilter(
                  e.target.value
                )
              }
            >
              <option value="all">
                Category
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>

            <select
              value={
                stockFilter
              }
              onChange={(e) =>
                setStockFilter(
                  e.target.value
                )
              }
            >
              <option value="all">
                Low Stock
              </option>

              <option value="low">
                Low Stock
              </option>

              <option value="out">
                Out of Stock
              </option>

              <option value="available">
                In Stock
              </option>
            </select>

            <button
              type="button"
              className="inventory-export-button"
              onClick={
                handleExport
              }
            >
              Export
            </button>

          </div>

        </div>

        {/* ==================================
            ERROR
        ================================== */}

        {error && (
          <div className="inventory-error">
            {error}
          </div>
        )}

        {/* ==================================
            TABLE
        ================================== */}

        <div className="inventory-table-wrapper">

          <table className="inventory-table">

            <thead>
              <tr>
                <th>
                  Product
                </th>

                <th>
                  Stock
                </th>

                <th>
                  Low Alert
                </th>

                <th>
                  Status
                </th>
              </tr>
            </thead>

            <tbody>

              {paginatedInventory.length >
              0 ? (
                paginatedInventory.map(
                  (item, index) => {

                    const stock =
                      getStock(item);

                    const lowAlert =
                      getLowAlert(item);

                    const status =
                      getStatus(item);

                    return (
                      <tr
                        key={
                          item?._id ||
                          index
                        }
                      >

                        <td>
                          {getProductName(
                            item
                          )}
                        </td>

                        <td>
                          {stock}
                        </td>

                        <td>
                          {lowAlert}
                        </td>

                        <td>

                          <span
                            className={`inventory-status ${
                              status ===
                              "Out of Stock"
                                ? "out"
                                : status ===
                                  "Low stock"
                                ? "low"
                                : "available"
                            }`}
                          >
                            {status}
                          </span>

                        </td>

                      </tr>
                    );
                  }
                )
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="inventory-empty"
                  >
                    No inventory found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

        {/* ==================================
            PAGINATION
        ================================== */}

        <div className="inventory-pagination">

          <button
            type="button"
            disabled={
              currentPage === 1
            }
            onClick={() =>
              goToPage(
                currentPage - 1
              )
            }
          >
            Previous
          </button>

          {Array.from(
            {
              length:
                totalPages,
            },
            (_, index) => {
              const page =
                index + 1;

              return (
                <button
                  key={page}
                  type="button"
                  className={
                    currentPage ===
                    page
                      ? "active"
                      : ""
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

          <button
            type="button"
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
            Next
          </button>

        </div>

        {/* ==================================
            FOOTER
        ================================== */}

        <div className="inventory-footer">
          <span>
            © 2026
          </span>

          <span>
            Call. All rights reserved.
            The Call is made with ♥ in India
          </span>
        </div>

      </div>

    </div>
  );
};

export default Inventory;