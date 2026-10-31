import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";
import API from "../api/axios";
import SuccessPopup from "../components/successpop";
import { PayPalButtons } from "@paypal/react-paypal-js";

const API_ORIGIN = import.meta.env.VITE_API_BASE_URL.replace(
  /\/api\/?$/,
  ""
);
const TAX_RATE = 0.05;
const PAID_STATUSES = ["COMPLETED", "PAID", "SUCCESS", "SUCCEEDED", "CAPTURED"];

/* ==========================================
   HELPERS
========================================== */

const resolveImageUrl = (value) => {
  const imageUrl = value?.imageUrl || value;

  if (!imageUrl) return "";

  let imagePath = String(imageUrl).trim();

  if (!imagePath) return "";

  if (/^https?:\/\//i.test(imagePath)) {
    if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(imagePath)) {
      return imagePath;
    }

    imagePath = imagePath.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i,
      ""
    );
  }

  imagePath = imagePath.replace(/^\/+/, "");

  if (imagePath.startsWith("uploads/")) {
    return `${API_ORIGIN}/${imagePath}`;
  }

  return `${API_ORIGIN}/uploads/${imagePath}`;
};

/*
 * Payment counts as successful ONLY when the capture response says so.
 * If the backend sends any status field, it must be a "paid" status.
 */
const isCaptureCompleted = (response) => {
  const body = response?.data;
  const inner = body?.data || {};

  if (body?.success !== true) return false;
  if (inner.success === false) return false;

  const statuses = [
    inner.status,
    inner.paypalStatus,
    inner.captureStatus,
    inner.paymentStatus,
    inner.paymentstatus,
    inner.capture?.status,
    inner.order?.paymentstatus,
    inner.order?.paymentStatus,
  ]
    .filter(Boolean)
    .map((s) => String(s).toUpperCase());

  if (statuses.length === 0) return true;

  return statuses.every((s) => PAID_STATUSES.includes(s));
};

const Checkout = () => {
  const navigate = useNavigate();
  const captureInProgress = useRef(false);

  /* ==========================================
     ADDRESS DATA
  ========================================== */

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(true);

  /* ==========================================
     PAYMENT METHOD
  ========================================== */

  const [paymentMethod, setPaymentMethod] = useState("cod");

  /* ==========================================
     COUPON
  ========================================== */

  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showAllCoupons, setShowAllCoupons] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  /* ==========================================
     CART PRODUCTS
  ========================================== */

  const [products, setProducts] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);

  /* ==========================================
     ORDER / PAYMENT STATE
  ========================================== */

  const [placingOrder, setPlacingOrder] = useState(false);
  const [success, setsucess] = useState(false);
  const [showPayPalPopup, setShowPayPalPopup] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [paymentError, setPaymentError] = useState("");

  const [showFailurePopup, setShowFailurePopup] = useState(false);
  const [failureReason, setFailureReason] = useState("");

  const [error, setError] = useState("");

  /* ==========================================
     FETCH COUPONS
  ========================================== */

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setCouponLoading(true);

        const response = await API.get("/admin/coupons");

        const couponData =
          response.data?.data || response.data?.coupons || [];

        const now = new Date();

        const activeCoupons = (
          Array.isArray(couponData) ? couponData : []
        ).filter((coupon) => {
          const status = String(coupon.status || "").toLowerCase();

          if (status !== "active") return false;

          const validFromValue = coupon.valid_from || coupon.validFrom;
          const validToValue = coupon.valid_to || coupon.validTo;

          if (!validFromValue || !validToValue) return true;

          const validFrom = new Date(validFromValue);
          const validTo = new Date(validToValue);

          if (
            Number.isNaN(validFrom.getTime()) ||
            Number.isNaN(validTo.getTime())
          ) {
            return false;
          }

          return now >= validFrom && now <= validTo;
        });

        setAvailableCoupons(activeCoupons);
      } catch (error) {
        console.error("COUPON FETCH ERROR:", error);
        setAvailableCoupons([]);
      } finally {
        setCouponLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  /* ==========================================
     FETCH ADDRESSES
  ========================================== */

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setAddressLoading(true);

        const response = await API.get("/auth/address");

        const addressData = Array.isArray(response.data)
          ? response.data
          : [];

        setAddresses(addressData);

        const defaultAddress = addressData.find(
          (address) => address.isDefault === true
        );

        if (defaultAddress) {
          setSelectedAddress(
            String(defaultAddress._id || defaultAddress.id)
          );
        } else if (addressData.length > 0) {
          setSelectedAddress(
            String(addressData[0]._id || addressData[0].id)
          );
        }
      } catch (error) {
        console.error("GET ADDRESS ERROR:", error);
        setAddresses([]);
      } finally {
        setAddressLoading(false);
      }
    };

    fetchAddresses();
  }, []);

  /* ==========================================
     FETCH CART
  ========================================== */

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setCartLoading(true);

        const response = await API.get("/cart");

        const cartItems = response.data?.data?.cartitems || [];

        setProducts(cartItems);
      } catch (error) {
        console.error("GET CART ERROR:", error);
        setProducts([]);
      } finally {
        setCartLoading(false);
      }
    };

    fetchCart();
  }, []);

  /* ==========================================
     PRODUCT GETTERS
  ========================================== */

  const getProductImage = (product) => {
    if (product.image) return resolveImageUrl(product.image);

    if (product.productImages?.length > 0) {
      return resolveImageUrl(product.productImages[0]);
    }

    if (product.variant?.productImages?.length > 0) {
      return resolveImageUrl(product.variant.productImages[0]);
    }

    return "";
  };

  const getProductName = (product) => {
    return (
      product.productName ||
      product.name ||
      product.product?.productName ||
      "Product"
    );
  };

  const getProductPrice = (product) => {
    return Number(
      product.price ||
        product.variant?.price ||
        product.productVariant?.price ||
        0
    );
  };

  const getProductQuantity = (product) => {
    return Number(product.quantity || 1);
  };

  /* ==========================================
     CALCULATIONS
  ========================================== */

  const subtotal = products.reduce((total, product) => {
    return total + getProductPrice(product) * getProductQuantity(product);
  }, 0);

  const shipping = products.length > 0 ? 50 : 0;

  const discount = couponApplied ? Number(couponDiscount || 0) : 0;

  const discountedSubtotal = Math.max(
    0,
    Number(subtotal) - Number(discount)
  );

  /* Tax is calculated AFTER coupon discount. */
  const tax = discountedSubtotal * TAX_RATE;

  const total = Math.max(
    0,
    Number(discountedSubtotal) + Number(tax) + Number(shipping)
  );

  /* ==========================================
     PAYPAL USD AMOUNT
  ========================================== */

  const paypalUsdRate = Math.max(
    0.01,
    Number(import.meta.env.VITE_PAYPAL_USD_RATE || 90)
  );

  const paypalTestAmount = Math.max(
    0.01,
    Number((Number(total) / paypalUsdRate).toFixed(2))
  );

  /* ==========================================
     APPLY COUPON
  ========================================== */

  const handleCoupon = async (coupon) => {
    if (!coupon) return;

    try {
      const couponStatus = coupon.status || coupon.couponStatus;

      if (
        couponStatus &&
        String(couponStatus).toLowerCase() !== "active"
      ) {
        alert("This coupon is not active.");
        return;
      }

      const validFromValue = coupon.valid_from || coupon.validFrom;
      const validToValue = coupon.valid_to || coupon.validTo;

      if (validFromValue && validToValue) {
        const now = new Date();
        const validFrom = new Date(validFromValue);
        const validTo = new Date(validToValue);

        if (
          Number.isNaN(validFrom.getTime()) ||
          Number.isNaN(validTo.getTime())
        ) {
          alert("Invalid coupon validity dates.");
          return;
        }

        if (now < validFrom || now > validTo) {
          alert("This coupon is not currently valid.");
          return;
        }
      }

      const minimumOrder = Number(
        coupon.minorderAmount ?? coupon.minOrderAmount ?? 0
      );

      if (Number(subtotal) < minimumOrder) {
        alert(
          `Minimum order amount for this coupon is ₹${minimumOrder.toLocaleString(
            "en-IN"
          )}`
        );
        return;
      }

      const couponType = String(
        coupon.couponType || coupon.coupon_type || ""
      ).toLowerCase();

      if (couponType === "firstorder") {
        try {
          await API.get(`/admin/coupons/${coupon._id}/eligibility`);
        } catch (error) {
          alert(
            error.response?.data?.message ||
              "This coupon is available only for your first order."
          );
          return;
        }
      }

      const discountType = String(
        coupon.discounttype || coupon.discountType || ""
      ).toLowerCase();

      const discountValue = Number(
        coupon.discountvalue ?? coupon.discountValue ?? 0
      );

      const maximumDiscount =
        coupon.maxdiscountAmount ??
        coupon.maxDiscountAmount ??
        coupon.maximumDiscountAmount ??
        coupon.maximumdiscountAmount;

      if (discountType !== "percentage" && discountType !== "fixed") {
        console.error("INVALID DISCOUNT TYPE:", discountType);
        alert("Invalid coupon discount type.");
        return;
      }

      if (!Number.isFinite(discountValue) || discountValue <= 0) {
        alert("This coupon has an invalid discount value.");
        return;
      }

      let calculatedDiscount = 0;

      if (discountType === "percentage") {
        calculatedDiscount = Number(subtotal) * (discountValue / 100);

        if (
          maximumDiscount !== null &&
          maximumDiscount !== undefined &&
          maximumDiscount !== ""
        ) {
          const maxDiscount = Number(maximumDiscount);

          if (Number.isFinite(maxDiscount) && maxDiscount >= 0) {
            calculatedDiscount = Math.min(calculatedDiscount, maxDiscount);
          }
        }
      }

      if (discountType === "fixed") {
        calculatedDiscount = discountValue;
      }

      calculatedDiscount = Math.min(
        Number(calculatedDiscount),
        Number(subtotal)
      );

      calculatedDiscount = Number(calculatedDiscount.toFixed(2));

      if (
        !Number.isFinite(calculatedDiscount) ||
        calculatedDiscount <= 0
      ) {
        alert("This coupon does not provide a valid discount.");
        return;
      }

      setCouponDiscount(calculatedDiscount);
      setCouponApplied(true);
      setSelectedCoupon(coupon);
      setShowAllCoupons(false);
    } catch (error) {
      console.error("APPLY COUPON ERROR:", error);

      alert(
        error.response?.data?.message || "Unable to apply coupon"
      );
    }
  };

  const handleRemoveCoupon = () => {
    setCouponDiscount(0);
    setCouponApplied(false);
    setSelectedCoupon(null);
  };

  /* ==========================================
     ADDRESS HANDLERS
  ========================================== */

  const handleAddAddress = () => {
    navigate("/profile/address/add");
  };

  const handleEditAddress = (id) => {
    navigate(`/profile/address/edit/${id}`);
  };

  const handleSelectAddress = (id) => {
    setSelectedAddress(String(id));
  };

  const getSelectedAddressData = () => {
    const selectedAddressData = addresses.find(
      (address) =>
        String(address._id || address.id) === String(selectedAddress)
    );

    if (!selectedAddressData) {
      throw new Error("Selected address not found");
    }

    return selectedAddressData;
  };

  const buildAddressData = () => {
    const selectedAddressData = getSelectedAddressData();

    return {
      name: selectedAddressData.FullName,
      address: selectedAddressData.address,
      pincode: selectedAddressData.pincode,
    };
  };

  /* ==========================================
     BUILD ORDER ITEMS
     COD => "confirmed"
     PayPal / Wallet => "pending" until payment is verified
  ========================================== */

  const buildOrderItems = (itemStatus = "pending") => {
    return products.map((product) => ({
      productId:
        product.productId || product.product?._id || product._id,

      variantId:
        product.variantId ||
        product.variant?._id ||
        product.productVariant?._id,

      quantity: getProductQuantity(product),

      price: getProductPrice(product),

      status: itemStatus,
    }));
  };

  const buildOrderData = (method) => ({
    paymentmethod: method,
    orderstatus: "pending",
    subtotal: subtotal,
    discountamount: discount,
    total: total,
    coupondiscount: couponApplied ? couponDiscount : 0,
    couponId: couponApplied ? selectedCoupon?._id : null,
    paymentstatus: "pending",
    deliverycharge: shipping,
    deliverydate: null,
    address: buildAddressData(),
  });

  /* ==========================================
     REMOVE ORDERED PRODUCTS FROM CART
  ========================================== */

  const removeOrderedProductsFromCart = async () => {
    try {
      await Promise.allSettled(
        products.map((product) => {
          const variantId =
            product.variantId ||
            product.variant?._id ||
            product.productVariant?._id;

          if (!variantId) return Promise.resolve();

          return API.delete(`/cart/remove/${variantId}`);
        })
      );
    } catch (cartError) {
      console.error("REMOVE CART AFTER ORDER ERROR:", cartError);
    }
  };

  /* ==========================================
     FINALIZE COD ORDER
  ========================================== */

  const finalizeOrder = async (orderData, orderItems) => {
    const response = await API.post("/checkout/place-order", {
      orderData,
      orderItems,
    });

    const orderId = response.data?.data?.order?._id;

    await removeOrderedProductsFromCart();

    setProducts([]);
    setsucess(true);

    setTimeout(() => {
      if (orderId) {
        navigate(`/order-result/${orderId}?status=success`);
      } else {
        navigate("/order-result/no-order?status=success");
      }
    }, 1200);
  };

  /* ==========================================
     PLACE ORDER
  ========================================== */

  const handlePlaceOrder = async () => {
    setError("");
    setPaymentError("");
    setShowFailurePopup(false);
    setFailureReason("");

    if (!selectedAddress) {
      alert("Please select a delivery address");
      return;
    }

    if (products.length === 0) {
      alert("Your cart is empty");
      return;
    }

    if (!paymentMethod) {
      alert("Please select a payment method");
      return;
    }

    try {
      /* ======================================
         PAYPAL
         NOTE: success is NOT shown here. The
         popup only opens; success is shown in
         handlePayPalApprove after verified capture.
      ====================================== */

      if (paymentMethod === "paypal") {
        setPlacingOrder(true);

        try {
          const orderData = buildOrderData("ONLINE");
          const orderItems = buildOrderItems("pending");

          const orderResponse = await API.post("/checkout/place-order", {
            orderData,
            orderItems,
          });

          const localOrderId = orderResponse.data?.data?.order?._id;

          if (!localOrderId) {
            throw new Error("Local order was not created");
          }

          const paypalResponse = await API.post(
            "/payment/paypal/create-order",
            {
              orderId: localOrderId,
              amount: paypalTestAmount,
            }
          );

          const paypalOrderId =
            paypalResponse.data?.data?.paypalOrderId;

          if (!paypalOrderId) {
            throw new Error("PayPal order was not created");
          }

          setPendingOrderData({
            orderId: localOrderId,
            paypalOrderId,
            orderData,
            orderItems,
          });

          setShowPayPalPopup(true);
        } catch (paypalCreateError) {
          console.error("PAYPAL CREATE ERROR:", paypalCreateError);

          setShowPayPalPopup(false);

          setPaymentError(
            paypalCreateError?.response?.data?.message ||
              paypalCreateError?.message ||
              "Unable to start PayPal payment."
          );
        } finally {
          setPlacingOrder(false);
        }

        return;
      }

      /* ======================================
         WALLET
      ====================================== */

      if (paymentMethod === "wallet") {
        setPlacingOrder(true);

        try {
          const orderData = buildOrderData("WALLET");
          const orderItems = buildOrderItems("pending");

          const orderResponse = await API.post("/checkout/place-order", {
            orderData,
            orderItems,
          });

          const orderId = orderResponse.data?.data?.order?._id;

          if (!orderId) {
            throw new Error("Order was not created");
          }

          const walletResponse = await API.post("/wallet/payment", {
            orderId,
          });

          if (!walletResponse.data?.success) {
            throw new Error(
              walletResponse.data?.message || "Wallet payment failed"
            );
          }

          await removeOrderedProductsFromCart();

          setProducts([]);
          setsucess(true);

          setTimeout(() => {
            navigate(`/order-result/${orderId}?status=success`);
          }, 1200);
        } catch (walletError) {
          console.error("WALLET PAYMENT ERROR:", walletError);

          const responseMessage =
            walletError?.response?.data?.message ||
            walletError?.response?.data?.error ||
            "";

          const errorText = String(
            responseMessage || walletError?.message || ""
          ).toLowerCase();

          let message =
            responseMessage ||
            walletError?.message ||
            "Wallet payment failed";

          if (
            errorText.includes("insufficient") &&
            errorText.includes("balance")
          ) {
            message = "Insufficient wallet balance.";
          } else if (
            walletError?.code === "ERR_NETWORK" ||
            (!walletError?.response && walletError?.request)
          ) {
            message =
              "Network error. Please check your internet connection and try again.";
          }

          setPaymentError("");
          setError("");
          setFailureReason(message);
          setShowFailurePopup(true);
        } finally {
          setPlacingOrder(false);
        }

        return;
      }

      /* ======================================
         COD
      ====================================== */

      const orderData = buildOrderData("COD");
      const orderItems = buildOrderItems("confirmed");

      setPlacingOrder(true);

      await finalizeOrder(orderData, orderItems);
    } catch (error) {
      console.error("PLACE ORDER ERROR:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to place order";

      setError(message);

      alert(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  /* ==========================================
     PAYPAL APPROVE (only place PayPal success happens)
  ========================================== */

  const handlePayPalApprove = async (data) => {
    if (!pendingOrderData) {
      setPaymentError("Payment details are missing.");
      return;
    }

    if (captureInProgress.current) return;
    captureInProgress.current = true;

    try {
      setPaymentError("");
      setPlacingOrder(true);

      const paypalOrderId =
        data?.orderID || pendingOrderData.paypalOrderId;

      const localOrderId = pendingOrderData.orderId;

      /* CAPTURE PAYMENT */

      const captureResponse = await API.post(
        "/payment/paypal/capture-order",
        {
          paypalOrderId,
          orderId: localOrderId,
          amount: paypalTestAmount,
        }
      );

      console.log("PAYPAL CAPTURE RESPONSE:", captureResponse.data);

      /* STRICT VERIFICATION - no success unless money is captured */

      if (!isCaptureCompleted(captureResponse)) {
        throw new Error(
          captureResponse.data?.message ||
            "PayPal payment was not completed."
        );
      }

      setShowPayPalPopup(false);

      await removeOrderedProductsFromCart();

      setProducts([]);
      setPendingOrderData(null);

      setsucess(true);

      setTimeout(() => {
        navigate(`/order-result/${localOrderId}?status=success`);
      }, 1200);
    } catch (error) {
      console.error("PAYPAL PAYMENT ERROR:", error);

      setPaymentError(
        error?.response?.data?.message ||
          error?.message ||
          "PayPal payment failed. Please try again."
      );
    } finally {
      captureInProgress.current = false;
      setPlacingOrder(false);
    }
  };

  /* ==========================================
     PAYPAL CANCEL / ERROR
  ========================================== */

  const goToFailedResult = () => {
    const localOrderId = pendingOrderData?.orderId;

    setShowPayPalPopup(false);
    setPaymentError("");
    setPendingOrderData(null);

    if (localOrderId) {
      navigate(`/order-result/${localOrderId}?status=failed`);
    } else {
      navigate("/order-result/no-order?status=failed");
    }
  };

  const handlePayPalCancel = () => {
    goToFailedResult();
  };

  const handlePayPalError = (paypalError) => {
    console.error("PAYPAL CHECKOUT ERROR:", paypalError);
    goToFailedResult();
  };

  const closePayPalPopup = () => {
    if (placingOrder) return;

    setShowPayPalPopup(false);
    setPendingOrderData(null);
    setPaymentError("");
  };

  /* ==========================================
     COUPON DISPLAY HELPERS
  ========================================== */

  const getCouponType = (coupon) =>
    String(coupon.discounttype || coupon.discountType || "").toLowerCase();

  const getCouponValue = (coupon) =>
    Number(coupon.discountvalue ?? coupon.discountValue ?? 0);

  const getCouponMax = (coupon) =>
    coupon.maxdiscountAmount ?? coupon.maxDiscountAmount;

  const getCouponMinOrder = (coupon) =>
    Number(coupon.minorderAmount ?? coupon.minOrderAmount ?? 0);

  const getCouponSaveAmount = (coupon) => {
    if (getCouponType(coupon) === "percentage") {
      const max = getCouponMax(coupon);

      if (max !== null && max !== undefined && max !== "") {
        return Number(max);
      }

      return Number(subtotal) * (getCouponValue(coupon) / 100);
    }

    return getCouponValue(coupon);
  };

  /* ==========================================
     LOADING
  ========================================== */

  if (addressLoading || cartLoading) {
    return (
      <div className="checkout-page">
        <div style={{ textAlign: "center", padding: "80px" }}>
          Loading checkout...
        </div>
      </div>
    );
  }

  /* ==========================================
     RETURN
  ========================================== */

  return (
    <div className="checkout-page">
      {/* ======================================
          PAYPAL POPUP
      ====================================== */}

      {showPayPalPopup && (
        <div className="paypal-modal-overlay" onClick={closePayPalPopup}>
          <div
            className="paypal-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="paypal-modal-close"
              onClick={closePayPalPopup}
              disabled={placingOrder}
              aria-label="Close PayPal payment"
            >
              ×
            </button>

            <div className="paypal-modal-header">
              <div className="paypal-brand">PayPal</div>

              <h2>Complete your payment</h2>

              <p>
                PayPal Sandbox payment.
                <br />
                No real money will be charged.
              </p>
            </div>

            <div className="paypal-amount-card">
              <span>Order Total</span>

              <strong>₹ {Number(total).toLocaleString("en-IN")}</strong>

              <small>Pay securely with PayPal Sandbox</small>
            </div>

            {paymentError && (
              <div className="paypal-payment-error">{paymentError}</div>
            )}

            <div className="paypal-buttons-container">
              <PayPalButtons
                style={{
                  layout: "vertical",
                  shape: "rect",
                  label: "paypal",
                  height: 48,
                }}
                forceReRender={[paypalTestAmount]}
                createOrder={() => {
                  if (!pendingOrderData?.paypalOrderId) {
                    return Promise.reject(
                      new Error("PayPal order is not ready.")
                    );
                  }

                  return pendingOrderData.paypalOrderId;
                }}
                onApprove={handlePayPalApprove}
                onCancel={handlePayPalCancel}
                onError={handlePayPalError}
              />
            </div>

            <div className="paypal-sandbox-note">
              <strong>PayPal Sandbox</strong>

              <span>
                Use your PayPal Personal Sandbox account as the buyer.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================
          SUCCESS POPUP
      ====================================== */}

      {success && <SuccessPopup message="Order placed successfully!" />}

      {/* ======================================
          PAYMENT FAILED POPUP
      ====================================== */}

      {showFailurePopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setShowFailurePopup(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#ffffff",
              borderRadius: "14px",
              padding: "30px",
              textAlign: "center",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                width: "58px",
                height: "58px",
                margin: "0 auto 16px",
                borderRadius: "50%",
                background: "#fff1f1",
                color: "#d93025",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                fontWeight: "700",
              }}
            >
              ×
            </div>

            <h2
              style={{
                margin: "0 0 10px",
                color: "#222222",
                fontSize: "22px",
                fontWeight: "700",
              }}
            >
              Payment Failed
            </h2>

            <p
              style={{
                margin: "0 0 24px",
                color: "#666666",
                fontSize: "15px",
                lineHeight: "1.5",
              }}
            >
              {failureReason}
            </p>

            <button
              type="button"
              onClick={() => setShowFailurePopup(false)}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "7px",
                padding: "12px 18px",
                background: "#222222",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* ======================================
          CHECKOUT STEPS
      ====================================== */}

      <div className="checkout-steps">
        <div className="checkout-step active">
          <div className="step-circle">01</div>
          <span>SHOPPING CART</span>
        </div>

        <div className="step-line"></div>

        <div className="checkout-step active">
          <div className="step-circle">02</div>
          <span>CHECKOUT</span>
        </div>

        <div className="step-line"></div>

        <div className="checkout-step">
          <div className="step-circle">03</div>
          <span>ORDER COMPLETE</span>
        </div>
      </div>

      {/* ======================================
          DELIVERY + COUPON SECTION
      ====================================== */}

      <div className="checkout-top-section">
        {/* COUPON CARD */}

        <div className="coupon-card">
          <div className="coupon-content">
            {!couponApplied ? (
              <>
                <div className="coupon-summary-row">
                  <div className="coupon-summary-text">
                    Order summary - {products.length} item
                    {products.length !== 1 ? "s" : ""}
                  </div>

                  <div className="coupon-summary-amount">
                    ₹{Number(subtotal).toLocaleString("en-IN")}
                  </div>
                </div>

                <button
                  type="button"
                  className="coupon-button"
                  onClick={() => setShowAllCoupons(true)}
                  disabled={
                    couponLoading || availableCoupons.length === 0
                  }
                >
                  <span>
                    {couponLoading ? "LOADING..." : "VIEW ALL COUPON"}
                  </span>

                  <span className="coupon-button-arrow">›</span>
                </button>
              </>
            ) : (
              <>
                <div className="coupon-summary-row">
                  <div>
                    <div className="coupon-applied-label">
                      Coupon Applied
                    </div>

                    <div className="coupon-applied-code">
                      {selectedCoupon?.code}
                    </div>
                  </div>

                  <div className="coupon-saved">
                    -₹{Number(couponDiscount).toLocaleString("en-IN")}
                  </div>
                </div>

                <button
                  type="button"
                  className="coupon-button coupon-remove-button"
                  onClick={handleRemoveCoupon}
                >
                  <span>REMOVE COUPON</span>

                  <span className="coupon-button-arrow">×</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* COUPON MODAL */}

        {showAllCoupons && !couponApplied && (
          <div
            className="coupon-modal-overlay"
            onClick={() => setShowAllCoupons(false)}
          >
            <div
              className="coupon-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="coupon-modal-header">
                <div className="coupon-modal-title">APPLY COUPON</div>

                <button
                  type="button"
                  className="coupon-modal-close"
                  onClick={() => setShowAllCoupons(false)}
                  aria-label="Close coupon popup"
                >
                  ×
                </button>
              </div>

              <div className="coupon-modal-code-section">
                <input
                  type="text"
                  className="coupon-modal-input"
                  placeholder="Enter coupon code"
                />

                <button
                  type="button"
                  className="coupon-modal-check"
                  onClick={() => setShowAllCoupons(true)}
                >
                  CHECK
                </button>
              </div>

              <div className="coupon-modal-body">
                {couponLoading ? (
                  <div className="coupon-modal-empty">
                    Loading coupons...
                  </div>
                ) : availableCoupons.length === 0 ? (
                  <div className="coupon-modal-empty">
                    No active coupons available.
                  </div>
                ) : (
                  availableCoupons.map((coupon, index) => (
                    <React.Fragment key={coupon._id}>
                      {index === 1 && (
                        <div className="coupon-modal-section-title">
                          UNLOCK MORE COUPONS
                        </div>
                      )}

                      <div className="coupon-modal-item">
                        <div
                          className={`coupon-modal-checkbox ${
                            index === 0 ? "checked" : ""
                          }`}
                        >
                          {index === 0 && <span>✓</span>}
                        </div>

                        <div className="coupon-modal-item-content">
                          <div className="coupon-modal-code">
                            {coupon.code}
                          </div>

                          <div className="coupon-modal-save">
                            Save ₹
                            {getCouponSaveAmount(coupon).toLocaleString(
                              "en-IN"
                            )}
                          </div>

                          <div className="coupon-modal-description">
                            {getCouponType(coupon) === "percentage"
                              ? `${getCouponValue(
                                  coupon
                                )}% off on minimum purchase of ₹${getCouponMinOrder(
                                  coupon
                                ).toLocaleString("en-IN")}.`
                              : `₹${getCouponValue(
                                  coupon
                                ).toLocaleString(
                                  "en-IN"
                                )} off on minimum purchase of ₹${getCouponMinOrder(
                                  coupon
                                ).toLocaleString("en-IN")}.`}
                          </div>

                          <div className="coupon-modal-expiry">
                            Expires on:{" "}
                            {new Date(
                              coupon.valid_to || coupon.validTo
                            ).toLocaleDateString("en-IN")}{" "}
                            | 11:55 PM
                          </div>
                        </div>

                        <div className="coupon-modal-action">
                          <button
                            type="button"
                            className="coupon-modal-apply"
                            onClick={() => handleCoupon(coupon)}
                          >
                            APPLY
                          </button>
                        </div>
                      </div>
                    </React.Fragment>
                  ))
                )}
              </div>

              <div className="coupon-modal-footer">
                <div className="coupon-modal-saving">
                  <span>Maximum savings:</span>

                  <strong>
                    ₹
                    {availableCoupons.length > 0
                      ? Math.max(
                          ...availableCoupons.map(getCouponSaveAmount)
                        ).toLocaleString("en-IN")
                      : "0"}
                  </strong>
                </div>

                <button
                  type="button"
                  className="coupon-modal-footer-apply"
                  onClick={() => setShowAllCoupons(false)}
                >
                  APPLY
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADDRESS SECTION */}

        <div className="address-section">
          <div className="section-small-title">CHOOSE DELIVERY POINT</div>

          <div className="address-grid">
            {addresses.map((address) => {
              const addressId = String(address._id || address.id);

              return (
                <div
                  key={addressId}
                  className={`address-card ${
                    selectedAddress === addressId ? "selected" : ""
                  }`}
                  onClick={() => handleSelectAddress(addressId)}
                >
                  <div className="address-card-header">
                    <div className="address-radio">
                      <span
                        className={
                          selectedAddress === addressId
                            ? "radio-selected"
                            : ""
                        }
                      ></span>
                    </div>

                    {address.isDefault && (
                      <span className="default-label">DEFAULT</span>
                    )}

                    {selectedAddress === addressId && (
                      <span className="selected-address-label">
                        ✓ SELECTED
                      </span>
                    )}

                    <button
                      className="edit-address"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAddress(addressId);
                      }}
                    >
                      ✎
                    </button>
                  </div>

                  <div className="address-name">{address.FullName}</div>

                  <div className="address-details">
                    {address.address}
                    <br />

                    {address.landmark && (
                      <>
                        {address.landmark}
                        <br />
                      </>
                    )}

                    {address.district && (
                      <>
                        {address.district}
                        <br />
                      </>
                    )}

                    {address.city && (
                      <>
                        {address.city}
                        <br />
                      </>
                    )}

                    {address.state && (
                      <>
                        {address.state}
                        <br />
                      </>
                    )}

                    {address.pincode}
                    <br />

                    {address.MobileNumber}
                  </div>

                  <button
                    className="address-select-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAddress(addressId);
                    }}
                  >
                    {selectedAddress === addressId
                      ? "✓ SELECTED"
                      : "SELECT"}
                  </button>
                </div>
              );
            })}

            {/* ADD ADDRESS */}

            <div className="add-address-card" onClick={handleAddAddress}>
              <div className="add-address-icon">+</div>

              <span>Add new address</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================
          ERROR
      ====================================== */}

      {error && (
        <div
          style={{
            color: "red",
            textAlign: "center",
            margin: "15px",
          }}
        >
          {error}
        </div>
      )}

      {/* ======================================
          BOTTOM CHECKOUT SECTION
      ====================================== */}

      <div className="checkout-bottom-section">
        {/* PAYMENT METHODS */}

        <div className="payment-card">
          <h3>Payment Methods</h3>

          <div className="payment-line"></div>

          <p className="payment-subtitle">Select any payment methods</p>

          <label className="payment-option">
            <input
              type="radio"
              name="payment"
              value="paypal"
              checked={paymentMethod === "paypal"}
              onChange={() => setPaymentMethod("paypal")}
            />

            <span>PayPal</span>
          </label>

          <label className="payment-option">
            <input
              type="radio"
              name="payment"
              value="wallet"
              checked={paymentMethod === "wallet"}
              onChange={() => setPaymentMethod("wallet")}
            />

            <span>Wallet</span>
          </label>

          <label className="payment-option">
            <input
              type="radio"
              name="payment"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")}
            />

            <span>Cash On Delivery</span>
          </label>
        </div>

        {/* RIGHT SIDE */}

        <div className="checkout-right">
          {/* PRODUCTS */}

          <div className="checkout-products">
            {products.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center" }}>
                Your cart is empty
              </div>
            ) : (
              products.map((product, index) => {
                const image = getProductImage(product);
                const name = getProductName(product);
                const quantity = getProductQuantity(product);
                const price = getProductPrice(product);
                const itemTax = price * quantity * TAX_RATE;

                return (
                  <div
                    className="checkout-product"
                    key={
                      product.variantId ||
                      product._id ||
                      product.id ||
                      index
                    }
                  >
                    <div className="checkout-product-image">
                      {image ? (
                        <img src={image} alt={name} />
                      ) : (
                        <div>No Image</div>
                      )}
                    </div>

                    <div className="checkout-product-info">
                      <div className="checkout-product-name">{name}</div>

                      <div className="checkout-product-quantity">
                        Quantity: {quantity}
                      </div>

                      {product.size && <div>Size: {product.size}</div>}

                      {product.color && <div>Color: {product.color}</div>}
                    </div>

                    <div className="checkout-product-price">
                      <div>
                        ₹ {(price * quantity).toLocaleString("en-IN")}
                      </div>

                      <small>
                        Tax 5%: ₹{" "}
                        {itemTax.toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}
                      </small>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* PRICE SUMMARY */}

          <div className="price-summary">
            <div className="summary-row">
              <span>Subtotal</span>

              <span>₹ {Number(subtotal).toLocaleString("en-IN")}</span>
            </div>

            <div className="summary-row">
              <span>Shipping</span>

              <span>₹ {Number(shipping).toLocaleString("en-IN")}</span>
            </div>

            <div className="summary-row">
              <span>Discount</span>

              <span className="discount-value">
                - ₹{" "}
                {Number(discount).toLocaleString("en-IN", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="summary-row">
              <span>Tax</span>

              <span>
                ₹{" "}
                {Number(tax).toLocaleString("en-IN", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>Total</span>

              <span>
                ₹{" "}
                {Number(total).toLocaleString("en-IN", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* PLACE ORDER */}

          <button
            className="place-order-button"
            onClick={handlePlaceOrder}
            disabled={placingOrder || products.length === 0}
          >
            {placingOrder ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
