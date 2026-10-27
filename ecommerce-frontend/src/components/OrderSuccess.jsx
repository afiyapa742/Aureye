
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Check,
  Package,
  Truck,
  MapPin,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  CalendarDays,
  ShieldCheck,
  Clock3,
  ChevronRight,
} from "lucide-react";
import API from "../api/axios";
import "./OrderSuccess.css";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchOrder = async () => {
      if (!orderId) {
        setError("Order ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await API.get(
          `/checkout/order/${orderId}`
        );

        console.log("ORDER SUCCESS RESPONSE:", response.data);

        const body = response.data;

        const orderData =
          body?.data?.order ??
          body?.data ??
          body?.order ??
          null;

        if (!cancelled) {
          if (orderData && typeof orderData === "object") {
            setOrder(orderData);
          } else {
            setError("Order details were not found.");
          }
        }
      } catch (err) {
        console.error(
          "ORDER SUCCESS ERROR:",
          err.response?.data || err.message
        );

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load your order details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const money = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (value) => {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getImage = (item) => {
    const image =
      item?.image ||
      item?.productImage ||
      item?.product?.image ||
      item?.product?.images?.[0] ||
      item?.images?.[0] ||
      item?.variant?.image ||
      item?.variant?.images?.[0];

    if (typeof image === "string") return image;

    if (image && typeof image === "object") {
      return image.url || image.path || image.secure_url || "";
    }

    return "";
  };

  const getProductName = (item) =>
    item?.productName ||
    item?.name ||
    item?.product?.productName ||
    item?.product?.name ||
    item?.variant?.name ||
    "Product";

  const getQuantity = (item) =>
    Number(item?.quantity ?? item?.qty ?? 1);

  const getItemPrice = (item) =>
    Number(
      item?.price ??
      item?.sellingPrice ??
      item?.variant?.price ??
      item?.product?.price ??
      0
    );

  if (loading) {
    return (
      <div className="order-success-page">
        <div className="order-success-loading">
          <span className="success-loader" />
          <p>Preparing your order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-success-page">
        <div className="order-success-error">
          <div className="error-icon">
            <Package size={30} />
          </div>

          <h2>We couldn't load your order</h2>
          <p>{error || "Order not found."}</p>

          <button
            className="success-primary-button"
            onClick={() => navigate("/home")}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const status = String(
    order.orderstatus || order.orderStatus || "pending"
  )
    .toLowerCase()
    .replaceAll(" ", "_");

  const cancelled = ["cancelled", "canceled"].includes(status);
  const returned = ["returned", "refunded"].includes(status);

  const statusSteps = [
    { key: "pending", label: "Order Placed", icon: Check },
    { key: "confirmed", label: "Confirmed", icon: ShieldCheck },
    { key: "processing", label: "Processing", icon: Package },
    { key: "shipped", label: "Shipped", icon: Truck },
    {
      key: "out_for_delivery",
      label: "Out for Delivery",
      icon: Truck,
    },
    { key: "delivered", label: "Delivered", icon: Check },
  ];

  const statusOrder = statusSteps.map((step) => step.key);
  const currentIndex = statusOrder.indexOf(status);

  const items =
    order.orderItems ||
    order.items ||
    order.products ||
    order.cartItems ||
    [];

  const orderNumber =
    order.orderNumber ||
    order.orderId ||
    order._id ||
    orderId;

  const orderDate = formatDate(order.createdAt || order.orderDate);

  const subtotal = Number(
    order.subtotal ??
    order.subTotal ??
    items.reduce(
      (sum, item) => sum + getItemPrice(item) * getQuantity(item),
      0
    )
  );

  const discount = Number(
    order.discountamount ?? order.discountAmount ?? 0
  );

  const delivery = Number(
    order.deliverycharge ?? order.deliveryCharge ?? 0
  );

  const total = Number(
    order.total ??
    order.totalAmount ??
    order.grandTotal ??
    subtotal - discount + delivery
  );

  const address =
    order.address ||
    order.shippingAddress ||
    order.deliveryAddress ||
    null;

  const paymentMethod =
    order.paymentmethod ||
    order.paymentMethod ||
    "Not specified";

  const paymentStatus = String(
    order.paymentstatus || order.paymentStatus || "Pending"
  );

  const estimatedDate = order.estimatedDelivery
    ? formatDate(order.estimatedDelivery)
    : null;

  return (
    <main className="order-success-page">
      <div className="order-success-container">

        {/* BREADCRUMB */}
        <div className="success-breadcrumb">
          <button onClick={() => navigate("/home")}>
            Home
          </button>
          <ChevronRight size={14} />
          <span>Order Confirmation</span>
        </div>

        {/* SUCCESS HERO */}
        <section className="success-hero">
          <div className="success-hero-icon">
            <Check size={32} strokeWidth={2.5} />
          </div>

          <div className="success-hero-copy">
            <span className="success-eyebrow">
              ORDER CONFIRMATION
            </span>

            <h1>
              {cancelled
                ? "Order Cancelled"
                : returned
                ? "Order Update"
                : "Yay! Your order is placed"}
            </h1>

            <p>
              {cancelled
                ? "This order has been cancelled."
                : returned
                ? "Your order status has been updated."
                : "Thank you for shopping with Aureya. Your order is being prepared with care."}
            </p>

            <div className="success-hero-meta">
              <span>
                <Package size={15} />
                Order #{String(orderNumber).slice(-12)}
              </span>

              <span>
                <CalendarDays size={15} />
                {orderDate}
              </span>
            </div>
          </div>

          <div className="success-hero-badge">
            <Check size={15} />
            {cancelled
              ? "Cancelled"
              : returned
              ? "Updated"
              : "Order Placed"}
          </div>
        </section>

        {/* MAIN TWO-COLUMN LAYOUT */}
        <div className="success-main-grid">

          {/* LEFT COLUMN */}
          <div className="success-main-column">

            {/* TRACKING */}
            {!cancelled && !returned && (
              <section className="success-card tracking-card">
                <div className="success-card-heading">
                  <div>
                    <span className="success-section-kicker">
                      YOUR PURCHASE
                    </span>
                    <h2>Track your order</h2>
                  </div>

                  <span className="tracking-order-status">
                    {status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="tracking-timeline">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon;
                    const completed =
                      currentIndex >= index && currentIndex !== -1;
                    const current = currentIndex === index;

                    return (
                      <div
                        className={`tracking-step ${
                          completed ? "completed" : ""
                        } ${current ? "current" : ""}`}
                        key={step.key}
                      >
                        <div className="tracking-step-marker">
                          {completed ? (
                            <Check size={16} />
                          ) : (
                            <Icon size={16} />
                          )}
                        </div>

                        {index < statusSteps.length - 1 && (
                          <div
                            className={`tracking-connector ${
                              currentIndex > index ? "completed" : ""
                            }`}
                          />
                        )}

                        <span className="tracking-step-label">
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="tracking-note">
                  <Clock3 size={18} />
                  <div>
                    <strong>
                      {status === "delivered"
                        ? "Your order has been delivered"
                        : "We'll keep you updated"}
                    </strong>
                    <p>
                      {estimatedDate
                        ? `Estimated delivery: ${estimatedDate}`
                        : "Visit your order details to check the latest status."}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* ORDERED PRODUCTS */}
            <section className="success-card ordered-items-card">
              <div className="success-card-heading">
                <div>
                  <span className="success-section-kicker">
                    WHAT YOU ORDERED
                  </span>
                  <h2>Order items</h2>
                </div>

                <span className="item-count">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>

              {items.length > 0 ? (
                <div className="ordered-items-list">
                  {items.map((item, index) => {
                    const image = getImage(item);
                    const name = getProductName(item);
                    const quantity = getQuantity(item);
                    const price = getItemPrice(item);

                    return (
                      <div
                        className="ordered-product"
                        key={
                          item._id ||
                          item.productId ||
                          item.product?._id ||
                          index
                        }
                      >
                        <div className="ordered-product-image">
                          {image ? (
                            <img src={image} alt={name} />
                          ) : (
                            <div className="product-image-placeholder">
                              <ShoppingBag size={30} />
                            </div>
                          )}
                        </div>

                        <div className="ordered-product-info">
                          <h3>{name}</h3>

                          {(item.variant?.size || item.size) && (
                            <span>
                              Size: {item.variant?.size || item.size}
                            </span>
                          )}

                          {(item.color || item.variant?.color) && (
                            <span>
                              Color: {item.color || item.variant?.color}
                            </span>
                          )}

                          <span>Qty: {quantity}</span>
                        </div>

                        <div className="ordered-product-price">
                          <strong>{money(price * quantity)}</strong>
                          <span>{money(price)} each</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-order-items">
                  <Package size={28} />
                  <p>
                    Product details were not included in the order response.
                  </p>
                </div>
              )}
            </section>

            {/* DELIVERY ADDRESS */}
            <section className="success-card delivery-address-card">
              <div className="success-card-heading">
                <div>
                  <span className="success-section-kicker">
                    SHIPPING DETAILS
                  </span>
                  <h2>Delivery address</h2>
                </div>

                <div className="address-heading-icon">
                  <MapPin size={20} />
                </div>
              </div>

              {address ? (
                <div className="delivery-address-content">
                  <strong>
                    {address.name ||
                      address.fullName ||
                      address.fullname ||
                      "Customer"}
                  </strong>

                  {address.phone && <p>{address.phone}</p>}
                  {address.mobile && !address.phone && (
                    <p>{address.mobile}</p>
                  )}

                  <p>
                    {[
                      address.address,
                      address.street,
                      address.locality,
                      address.landmark,
                      address.city,
                      address.district,
                      address.state,
                      address.pincode || address.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Address details unavailable"}
                  </p>

                  {address.email && <p>{address.email}</p>}
                </div>
              ) : (
                <p className="muted-message">
                  Delivery address details are not available in the order response.
                </p>
              )}
            </section>

            {/* PAYMENT DETAILS */}
            <section className="success-card payment-details-card">
              <div className="success-card-heading">
                <div>
                  <span className="success-section-kicker">
                    TRANSACTION DETAILS
                  </span>
                  <h2>Payment information</h2>
                </div>

                <div className="payment-heading-icon">
                  <CreditCard size={20} />
                </div>
              </div>

              <div className="payment-info-row">
                <span>Payment method</span>
                <strong>{String(paymentMethod).replaceAll("_", " ")}</strong>
              </div>

              <div className="payment-info-row">
                <span>Payment status</span>
                <strong
                  className={
                    paymentStatus.toLowerCase() === "paid" ||
                    paymentStatus.toLowerCase() === "completed" ||
                    paymentStatus.toLowerCase() === "success"
                      ? "payment-status-success"
                      : ""
                  }
                >
                  {paymentStatus.replaceAll("_", " ")}
                </strong>
              </div>

              {order.paymentId && (
                <div className="payment-info-row">
                  <span>Payment reference</span>
                  <strong>{order.paymentId}</strong>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="success-sidebar">

            {/* PRICE DETAILS */}
            <section className="success-card price-details-card">
              <span className="success-section-kicker">
                PAYMENT BREAKDOWN
              </span>
              <h2>Price details</h2>

              <div className="price-breakdown-row">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>

              <div className="price-breakdown-row discount-row">
                <span>Discount</span>
                <span>- {money(discount)}</span>
              </div>

              <div className="price-breakdown-row">
                <span>Delivery charges</span>
                <span>
                  {delivery === 0 ? "FREE" : money(delivery)}
                </span>
              </div>

              {order.couponCode && (
                <div className="applied-coupon">
                  <Check size={15} />
                  Coupon applied: {order.couponCode}
                </div>
              )}

              <div className="price-breakdown-divider" />

              <div className="price-total-row">
                <span>Total paid / payable</span>
                <strong>{money(total)}</strong>
              </div>

              <p className="price-tax-note">
                Final amount based on your order details.
              </p>
            </section>

            {/* DELIVERY INFO */}
            <section className="success-card delivery-info-card">
              <div className="delivery-info-icon">
                <Truck size={23} />
              </div>

              <div>
                <h3>Delivery updates</h3>
                <p>
                  Track your order to follow its journey from our store to your door.
                </p>
              </div>
            </section>

            {/* ACTIONS */}
            <div className="success-action-buttons">
              <button
                type="button"
                className="success-primary-button"
                onClick={() =>
                  navigate(`/order-details/${orderId}`)
                }
              >
                View order details
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                className="success-secondary-button"
                onClick={() => navigate("/home")}
              >
                <ShoppingBag size={17} />
                Continue shopping
              </button>
            </div>

            <div className="success-support-note">
              <ShieldCheck size={18} />
              <span>Your order information is available in your account.</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default OrderSuccess;
