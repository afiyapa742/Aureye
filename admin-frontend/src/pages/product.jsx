import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./product.css";
import API from "../Api/axios";
import DeletePopup from "../combonent/deletepop";

const Product = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await API.get("/product");

      setProducts(response.data.data || []);
    } catch (error) {
      console.error("FETCH PRODUCTS ERROR:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to fetch products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Add product
  const handleAddProduct = () => {
    navigate("/admin/product/add");
  };

  // Edit product
  const handleEdit = (id) => {
    navigate(`/admin/product/edit/${id}`);
  };

  // Open delete popup
  const handleDeleteClick = (id) => {
    setSelectedProductId(id);
    setShowDeletePopup(true);
  };

  // Cancel delete
  const handleDeleteCancel = () => {
    setShowDeletePopup(false);
    setSelectedProductId(null);
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!selectedProductId) return;

    try {
      setDeleteLoading(true);

      await API.delete(
        `/product/delete/${selectedProductId}`
      );

      setProducts((prevProducts) =>
        prevProducts.filter(
          (product) =>
            product._id !== selectedProductId
        )
      );

      setShowDeletePopup(false);
      setSelectedProductId(null);
    } catch (error) {
      console.error("DELETE PRODUCT ERROR:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to delete product"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // Change product status
  const handleStatusChange = async (id, status) => {
    try {
      await API.put(`/product/status/${id}`, {
        status,
      });

      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product._id === id
            ? { ...product, status }
            : product
        )
      );
    } catch (error) {
      console.error("STATUS UPDATE ERROR:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to update product status"
      );
    }
  };

  // Search
  const filteredProducts = products.filter((product) =>
    product.productName
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  // Reset pagination when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Pagination
  const totalPages = Math.ceil(
    filteredProducts.length / productsPerPage
  );

  const startIndex =
    (currentPage - 1) * productsPerPage;

  const endIndex =
    startIndex + productsPerPage;

  const currentProducts =
    filteredProducts.slice(
      startIndex,
      endIndex
    );

  // Keep page valid after delete/search
  useEffect(() => {
    if (
      totalPages > 0 &&
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Stats
  const activeProducts = products.filter(
    (product) => product.status === "active"
  ).length;

  const inactiveProducts = products.filter(
    (product) => product.status === "inactive"
  ).length;

  return (
    <div className="product-page">

      {/* Header */}
      <div className="product-header">
        <div>
          <h1>Products</h1>
          <p>Manage your products</p>
        </div>

        <button
          type="button"
          className="add-product-btn"
          onClick={handleAddProduct}
        >
          + Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="product-stats">

        <div className="product-stat-card">
          <h3>Total Products</h3>
          <p>{products.length}</p>
        </div>

        <div className="product-stat-card">
          <h3>Active Products</h3>
          <p>{activeProducts}</p>
        </div>

        <div className="product-stat-card">
          <h3>Inactive Products</h3>
          <p>{inactiveProducts}</p>
        </div>

      </div>

      {/* Search */}
      <div className="product-search-section">
        <input
          type="text"
          placeholder="Search product..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="product-error">
          {errorMessage}
        </div>
      )}

      {/* Product Table */}
      <div className="product-table-container">

        {loading ? (
          <div className="product-loading">
            Loading products...
          </div>
        ) : (
          <table className="product-table">

            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {currentProducts.length > 0 ? (
                currentProducts.map((product) => (

                  <tr key={product._id}>

                    {/* Product Name */}
                    <td>
                      {product.productName}
                    </td>

                    {/* Category */}
                    <td>
                       {product.categoryId?.categoryName ||
    product.categoryId?.Categoryname ||
    "-"}
                    </td>

                    {/* Status */}
                    <td>

                      <div
                        className={`status-select-wrapper ${
                          product.status === "active"
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >

                        <select
                          value={product.status}
                          onChange={(e) =>
                            handleStatusChange(
                              product._id,
                              e.target.value
                            )
                          }
                          className="product-status-select"
                        >

                          <option value="active">
                            Active
                          </option>

                          <option value="inactive">
                            Inactive
                          </option>

                        </select>

                      </div>

                    </td>

                    {/* Actions */}
                    <td>

                      <div className="product-actions">

                        <button
                          type="button"
                          className="product-edit-btn"
                          onClick={() =>
                            handleEdit(
                              product._id
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="product-delete-btn"
                          onClick={() =>
                            handleDeleteClick(
                              product._id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))
              ) : (

                <tr>
                  <td
                    colSpan="4"
                    className="no-products"
                  >
                    No products found
                  </td>
                </tr>

              )}

            </tbody>

          </table>
        )}

      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (

        <div className="product-pagination">

          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage(
                (prev) => prev - 1
              )
            }
          >
            Previous
          </button>

          {Array.from(
            { length: totalPages },
            (_, index) => index + 1
          ).map((page) => (

            <button
              type="button"
              key={page}
              className={
                currentPage === page
                  ? "active"
                  : ""
              }
              onClick={() =>
                setCurrentPage(page)
              }
            >
              {page}
            </button>

          ))}

          <button
            type="button"
            disabled={
              currentPage === totalPages
            }
            onClick={() =>
              setCurrentPage(
                (prev) => prev + 1
              )
            }
          >
            Next
          </button>

        </div>

      )}

      {/* Delete Popup */}
      {showDeletePopup && (
        <DeletePopup
          user={products.find(
            (product) =>
              product._id ===
              selectedProductId
          )}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          loading={deleteLoading}
        />
      )}

    </div>
  );
};

export default Product;