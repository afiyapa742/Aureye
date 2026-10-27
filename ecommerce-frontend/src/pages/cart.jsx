import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Minus, Plus } from "lucide-react";
import API from "../api/axios";
import "./Cart.css";

const MAX_QTY_PER_PRODUCT = 3;

const Cart = () => {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ==========================================
     IMAGE URL
  ========================================== */

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (image.startsWith("http")) {
      return image;
    }

    return `http://localhost:5000/uploads/${image}`;
  };

  /* ==========================================
     GET CART
  ========================================== */

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/cart");

      const cart = response.data?.data;

      setCartItems(cart?.cartitems || []);
    } catch (error) {
      console.error("GET CART ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load cart"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  /* ==========================================
     STOCK + MAX QUANTITY
  ========================================== */

  // Returns the available stock, or null if the cart item has no stock info.
  const getStock = (item) => {
    const candidates = [
      item.stock,
      item.variant?.stock,
      item.product?.stock,
      item.availableStock,
    ];

    for (const value of candidates) {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        Number.isFinite(Number(value)) &&
        Number(value) >= 0
      ) {
        return Number(value);
      }
    }

    return null;
  };

  // Max allowed = smaller of 3 and the available stock.
  const getMaxQty = (item) => {
    const stock = getStock(item);

    if (stock === null) {
      return MAX_QTY_PER_PRODUCT;
    }

    return Math.min(MAX_QTY_PER_PRODUCT, stock);
  };

  const getQuantityNote = (item, quantity) => {
    const stock = getStock(item);
    const maxQty = getMaxQty(item);

    if (stock !== null && stock < 1) {
      return { text: "Out of stock", warning: true };
    }

    if (quantity > maxQty) {
      return {
        text: `Reduce quantity to ${maxQty}`,
        warning: true,
      };
    }

    if (quantity >= maxQty) {
      if (stock !== null && stock < MAX_QTY_PER_PRODUCT) {
        return { text: `Only ${stock} left`, warning: false };
      }

      return {
        text: `Max ${MAX_QTY_PER_PRODUCT} per product`,
        warning: false,
      };
    }

    return null;
  };

  /* ==========================================
     UPDATE QUANTITY
  ========================================== */

  const updateQuantity = async (
    variantId,
    quantity,
    maxQty = MAX_QTY_PER_PRODUCT
  ) => {
    if (quantity < 1) {
      return;
    }

    if (quantity > maxQty) {
      alert(
        maxQty < MAX_QTY_PER_PRODUCT
          ? `Only ${maxQty} available in stock`
          : `You can buy a maximum of ${MAX_QTY_PER_PRODUCT} per product`
      );
      return;
    }

    try {
      await API.put("/cart/edit", {
        variantId,
        quantity,
      });

      setCartItems((prev) =>
        prev.map((item) =>
          item.variantId === variantId
            ? {
                ...item,
                quantity,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "UPDATE CART ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Unable to update quantity"
      );
    }
  };

  /* ==========================================
     REMOVE PRODUCT
  ========================================== */

  const removeItem = async (variantId) => {
    try {
      await API.delete(
        `/cart/remove/${variantId}`
      );

      setCartItems((prev) =>
        prev.filter(
          (item) =>
            item.variantId !== variantId
        )
      );
    } catch (error) {
      console.error(
        "REMOVE CART ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Unable to remove product"
      );
    }
  };

  /* ==========================================
     PRICE
  ========================================== */

  const getPrice = (item) => {
    return Number(
      item.price ||
        item.product?.price ||
        item.variant?.price ||
        0
    );
  };

  /* ==========================================
     PRODUCT NAME
  ========================================== */

  const getProductName = (item) => {
    return (
      item.productName ||
      item.product?.productName ||
      item.variant?.productName ||
      "Product"
    );
  };

  /* ==========================================
     PRODUCT IMAGE
  ========================================== */

  const getProductImage = (item) => {
    const image =
      item.image ||
      item.product?.image ||
      item.product?.images?.[0] ||
      item.variant?.image ||
      "";

    return getImageUrl(image);
  };

  /* ==========================================
     SUBTOTAL
  ========================================== */

  const subtotal = cartItems.reduce(
    (total, item) => {
      return (
        total +
        getPrice(item) *
          Number(item.quantity || 0)
      );
    },
    0
  );

  /* ==========================================
     STOCK ISSUE (blocks checkout)
  ========================================== */

  const hasStockIssue = cartItems.some((item) => {
    const quantity = Number(item.quantity) || 1;
    const stock = getStock(item);

    return (
      (stock !== null && stock < 1) ||
      quantity > getMaxQty(item)
    );
  });

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="cart-loading">
        Loading cart...
      </div>
    );
  }

  /* ==========================================
     ERROR
  ========================================== */

  if (error) {
    return (
      <div className="cart-error">
        {error}
      </div>
    );
  }

  return (
    <div className="cart-page">

      {/* ======================================
          SALE BAR
      ====================================== */}



      {/* ======================================
          CHECKOUT STEPS
      ====================================== */}

      <div className="cart-steps">

        {/* STEP 01 - ACTIVE */}

        <div className="cart-step active">

          <div className="step-number">
            01
          </div>
 <p>SHOPPING CART</p>
          <div className="step-line"></div>

          

        </div>

        {/* STEP 02 */}

        <div className="cart-step">

          <div className="step-number">
            02
          </div>
 <p>CHECKOUT</p>
 
          <div className="step-line"></div>


        </div>

        {/* STEP 03 */}

        <div className="cart-step">

          <div className="step-number">
            03
          </div>

          <p>ORDER COMPLETE</p>

        </div>

      </div>

      {/* ======================================
          CART CONTENT
      ====================================== */}

      {cartItems.length === 0 ? (

        <div className="empty-cart">

          <h2>Your Cart is Empty</h2>

          <button
            type="button"
            onClick={() =>
              navigate("/home")
            }
          >
            Continue Shopping
          </button>

        </div>

      ) : (

        <div className="cart-content">

          {/* ==================================
              TABLE HEADER
          ================================== */}

          <div className="cart-header">

            <div className="cart-header-product">
              PRODUCT NAME
            </div>

            <div>
              PRICE
            </div>

            <div>
              QUANTITY
            </div>

            <div>
              TOTAL
            </div>

            <div>
              REMOVE
            </div>

          </div>

          {/* ==================================
              CART ITEMS
          ================================== */}

          <div className="cart-items">

            {cartItems.map((item) => {

              const price =
                getPrice(item);

              const quantity =
                Number(item.quantity) || 1;

              const total =
                price * quantity;

              const maxQty =
                getMaxQty(item);

              const quantityNote =
                getQuantityNote(item, quantity);

              return (
                <div
                  className="cart-item"
                  key={item.variantId}
                >

                  {/* PRODUCT */}

                  <div className="cart-product">

                    <div className="cart-product-image">

                      {getProductImage(item) ? (

                        <img
                          src={getProductImage(item)}
                          alt={getProductName(item)}
                        />

                      ) : (

                        <div className="no-image">
                          No Image
                        </div>

                      )}

                    </div>

                    <span className="cart-product-name">
                      {getProductName(item)}
                    </span>

                  </div>

                  {/* PRICE */}

                  <div className="cart-price">
                    ₹{price}
                  </div>

                  {/* QUANTITY */}

                  <div className="cart-quantity">

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.variantId,
                          quantity - 1,
                          maxQty
                        )
                      }
                      disabled={
                        quantity <= 1
                      }
                    >
                      <Minus size={10} />
                    </button>

                    <span>
                      {quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.variantId,
                          quantity + 1,
                          maxQty
                        )
                      }
                      disabled={
                        quantity >= maxQty
                      }
                    >
                      <Plus size={10} />
                    </button>

                    {quantityNote && (
                      <div
                        className={`cart-quantity-note ${
                          quantityNote.warning
                            ? "warning"
                            : ""
                        }`}
                      >
                        {quantityNote.text}
                      </div>
                    )}

                  </div>

                  {/* TOTAL */}

                  <div className="cart-item-total">
                    ₹{total}
                  </div>

                  {/* REMOVE */}

                  <div className="cart-remove">

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(
                          item.variantId
                        )
                      }
                    >
                      <X size={15} />
                    </button>

                  </div>

                </div>
              );
            })}

          </div>

          {/* ==================================
              SUBTOTAL
          ================================== */}

          <div className="cart-subtotal">

            <span>
              Sub Total
            </span>

            <strong>
              ₹{subtotal}
            </strong>

          </div>

          {/* ==================================
              BUTTONS
          ================================== */}

          <div className="cart-actions">

            {hasStockIssue && (
              <div className="cart-stock-warning">
                Please fix the quantity of the highlighted items to continue.
              </div>
            )}

            <button
              type="button"
              className="checkout-button"
              disabled={hasStockIssue}
              onClick={() =>
                navigate("/checkout")
              }
            >
              Proceed to checkout
            </button>

            <button
              type="button"
              className="continue-button"
              onClick={() =>
                navigate("/home")
              }
            >
              Continue Shopping
            </button>

          </div>

        </div>
      )}

    </div>
  );
};

export default Cart;