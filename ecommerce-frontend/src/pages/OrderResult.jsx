import React, { useEffect, useState } from "react";

import {

  useNavigate,

  useParams,

  useSearchParams,

} from "react-router-dom";

import { Check, X } from "lucide-react";

import API from "../api/axios";

import "./OrderResult.css";



const PAID_STATUSES = [

  "paid",

  "completed",

  "success",

  "successful",

  "captured",

];



const OrderResult = () => {

  const navigate = useNavigate();

  const { orderId } = useParams();

  const [searchParams] = useSearchParams();



  const urlStatus = String(searchParams.get("status") || "").toLowerCase();



  const [order, setOrder] = useState(null);

  const [payment, setPayment] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  useEffect(() => {

    let cancelled = false;



    const fetchOrder = async () => {

      /* Failed before any order existed (e.g. /order-result/no-order) */

      if (!orderId || orderId === "no-order") {

        if (urlStatus === "failed") {

          setLoading(false);

          return;

        }



        setError("Order ID is missing.");

        setLoading(false);

        return;

      }



      try {

        setLoading(true);

        setError("");



        const response = await API.get(`/checkout/order/${orderId}`);

        const body = response.data;



        const orderData =

          body?.data?.order ?? body?.data ?? body?.order ?? null;



        if (!orderData || typeof orderData !== "object") {

          throw new Error("Order details were not found.");

        }



        let paymentData = null;



        try {

          const paymentResponse = await API.get(

            `/checkout/order/${orderId}/payment`

          );



          const paymentBody = paymentResponse.data;



          paymentData =

            paymentBody?.data?.payment ??

            paymentBody?.data ??

            paymentBody?.payment ??

            null;

        } catch (paymentError) {

          console.warn(

            "Payment details could not be loaded:",

            paymentError.response?.data || paymentError.message

          );

        }



        if (!cancelled) {

          setOrder(orderData);

          setPayment(paymentData);

        }

      } catch (err) {

        console.error(

          "ORDER RESULT ERROR:",

          err.response?.data || err.message

        );



        if (!cancelled) {

          setError(

            err.response?.data?.message ||

              err.message ||

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

  }, [orderId, urlStatus]);



  const money = (value) =>

    `₹${Number(value || 0).toLocaleString("en-IN", {

      minimumFractionDigits: 0,

      maximumFractionDigits: 2,

    })}`;



  const formatDateTime = (value) => {

    if (!value) return "Not available";



    const date = new Date(value);



    if (Number.isNaN(date.getTime())) return "Not available";



    return date.toLocaleString("en-IN", {

      day: "2-digit",

      month: "2-digit",

      year: "numeric",

      hour: "2-digit",

      minute: "2-digit",

      hour12: true,

    });

  };



  const goToCheckout = () => navigate("/checkout");



  const stepsTracker = (lastActive) => (

    <div className="checkout-steps success-checkout-steps">

      <div className="checkout-step completed">

        <div className="step-circle">01</div>

        <span>SHOPPING CART</span>

      </div>



      <div className="step-line completed" />



      <div className="checkout-step completed">

        <div className="step-circle">02</div>

        <span>CHECKOUT</span>

      </div>



      <div className="step-line completed" />



      <div className={`checkout-step ${lastActive ? "active" : ""}`}>

        <div className="step-circle">03</div>

        <span>ORDER COMPLETE</span>

      </div>

    </div>

  );



  const failedIconStyle = {

    background: "#fff1f1",

    color: "#d93025",

  };



  /* ==========================================

     LOADING

  ========================================== */



  if (loading) {

    return (

      <main className="order-success-page">

        <div className="order-success-loading">

          <span className="success-loader" />

          <p>Preparing your order details...</p>

        </div>

      </main>

    );

  }



  /* ==========================================

     FAILED WITH NO ORDER

  ========================================== */



  if ((!orderId || orderId === "no-order") && urlStatus === "failed") {

    return (

      <main className="order-success-page">

        <div className="order-success-container">

          {stepsTracker(false)}



          <div className="order-success-error">

            <div className="figma-payment-status-icon" style={failedIconStyle}>

              <X size={19} strokeWidth={3} />

            </div>



            <h2>Payment Failed</h2>



            <p>Your payment was not completed. No money was charged.</p>



            <button

              type="button"

              className="success-primary-button"

              onClick={goToCheckout}

            >

              Try Again

            </button>

          </div>

        </div>

      </main>

    );

  }



  /* ==========================================

     LOAD ERROR

  ========================================== */



  if (error || !order) {

    return (

      <main className="order-success-page">

        <div className="order-success-error">

          <h2>We couldn't load your order</h2>

          <p>{error || "Order not found."}</p>



          <button

            type="button"

            className="success-primary-button"

            onClick={() => navigate("/home")}

          >

            Continue Shopping

          </button>

        </div>

      </main>

    );

  }



  /* ==========================================

     DERIVED VALUES

  ========================================== */



  const status = String(

    order.orderstatus || order.orderStatus || "pending"

  )

    .toLowerCase()

    .replaceAll(" ", "_");



  const cancelled = ["cancelled", "canceled"].includes(status);

  const returned = ["returned", "refunded"].includes(status);



  const orderNumber =

    order.orderNumber || order.orderId || order._id || orderId;



  const paymentMethod =

    payment?.paymentMethod ||

    payment?.paymentmethod ||

    order.paymentmethod ||

    order.paymentMethod ||

    "Not specified";



const paymentStatuses = [

  payment?.paymentStatus,

  payment?.paymentstatus,

  order.paymentstatus,

  order.paymentStatus,

]

  .filter(Boolean)

  .map((value) => String(value).toLowerCase().trim());



const successfulPayment = paymentStatuses.some((status) =>

  PAID_STATUSES.includes(status)

);

const paymentStatus =
  payment?.paymentStatus ||
  payment?.paymentstatus ||
  order.paymentstatus ||
  order.paymentStatus ||
  "Pending";



const methodUpper = String(paymentMethod).toUpperCase();



const isCOD =

  methodUpper.includes("COD") ||

  methodUpper.includes("CASH");



const paymentFailed =

  !cancelled &&

  !returned &&

  !isCOD &&

  !successfulPayment;

  const paymentTime =

    payment?.createdAt ||

    payment?.updatedAt ||

    order.paymentDate ||

    order.createdAt;



  const senderName =

    order.senderName ||

    payment?.senderName ||

    order.customerName ||

    order.user?.name ||

    order.user?.fullname ||

    "Customer";



  const total = Number(

    payment?.amount ??

      payment?.totalAmount ??

      order.total ??

      order.totalAmount ??

      order.grandTotal ??

      0

  );











  /* ==========================================

     TEXT

  ========================================== */



  let title = "Thank You for Your Order!";

  let description =

    "Your order has been successfully placed. Here are your order details:";

  let cardTitle = successfulPayment ? "Payment Success!" : "Order Placed!";



  if (cancelled) {

    title = "Your Order Was Cancelled";

    description = "Your order has been cancelled.";

    cardTitle = "Order Cancelled";

  } else if (returned) {

    title = "Your Order Has Been Updated";

    description = "Your order status has been updated.";

  } else if (paymentFailed) {

    title = "Payment Failed";

    description =

      "Your payment was not completed, so your order has not been confirmed. No money has been charged. Please try again.";

    cardTitle = "Payment Failed";

  }



  /* ==========================================

     RENDER

  ========================================== */



  return (

    <main className="order-success-page">

      <div className="order-success-container">

        {stepsTracker(!paymentFailed)}



        <section className="figma-order-success">

          {/* LEFT SIDE */}

          <div className="figma-success-left">

            <h1>{title}</h1>



            <p className="figma-success-description">{description}</p>



            {/* Success illustration (hidden when payment failed) */}

            {!paymentFailed && (

              <div className="figma-success-illustration">

                <svg

                  viewBox="0 0 300 190"

                  role="img"

                  aria-label="Order successfully placed illustration"

                >

                  <rect

                    x="72"

                    y="26"

                    width="120"

                    height="124"

                    rx="25"

                    fill="#eef6ff"

                  />



                  <rect

                    x="93"

                    y="18"

                    width="64"

                    height="91"

                    rx="5"

                    fill="#b8d7ff"

                  />



                  <rect

                    x="100"

                    y="25"

                    width="50"

                    height="78"

                    rx="3"

                    fill="#ffffff"

                  />



                  <rect

                    x="106"

                    y="34"

                    width="38"

                    height="5"

                    rx="2"

                    fill="#ff997f"

                  />



                  <rect

                    x="106"

                    y="45"

                    width="31"

                    height="5"

                    rx="2"

                    fill="#d6e5fa"

                  />



                  <rect

                    x="106"

                    y="56"

                    width="38"

                    height="5"

                    rx="2"

                    fill="#d6e5fa"

                  />



                  <rect

                    x="106"

                    y="67"

                    width="28"

                    height="5"

                    rx="2"

                    fill="#d6e5fa"

                  />



                  <rect

                    x="112"

                    y="48"

                    width="105"

                    height="72"

                    rx="7"

                    fill="#3474ca"

                  />



                  <rect

                    x="112"

                    y="48"

                    width="105"

                    height="14"

                    rx="5"

                    fill="#173f7d"

                  />



                  <rect

                    x="119"

                    y="72"

                    width="91"

                    height="4"

                    rx="2"

                    fill="#ffffff"

                    opacity=".75"

                  />



                  <rect

                    x="119"

                    y="81"

                    width="70"

                    height="4"

                    rx="2"

                    fill="#ffffff"

                    opacity=".55"

                  />



                  <path

                    d="M23 127 C42 119 59 102 77 100 L105 88

                       C113 85 120 93 114 100 L99 112

                       L120 113 L111 141 L80 157

                       C65 165 48 154 35 145 Z"

                    fill="#ffc4b0"

                  />



                  <path

                    d="M20 129 L40 119 L55 136 L38 150

                       C29 147 22 140 20 129Z"

                    fill="#ffd8ca"

                  />



                  <circle cx="188" cy="33" r="20" fill="#ffbf31" />



                  <path

                    d="M178 33 L185 40 L198 25"

                    fill="none"

                    stroke="#ffffff"

                    strokeWidth="5"

                    strokeLinecap="round"

                    strokeLinejoin="round"

                  />



                  {/* Person */}

                  <circle cx="159" cy="95" r="10" fill="#ffbd8c" />



                  <path

                    d="M151 91 Q158 79 168 90 L167 96 L151 96Z"

                    fill="#273c69"

                  />



                  <path

                    d="M151 107 L166 107 L172 139

                       L146 139Z"

                    fill="#ffbd31"

                  />



                  <path

                    d="M152 109 L142 124 L134 119"

                    fill="none"

                    stroke="#ffbd8c"

                    strokeWidth="7"

                    strokeLinecap="round"

                  />



                  <path

                    d="M165 111 L176 123 L186 117"

                    fill="none"

                    stroke="#ffbd8c"

                    strokeWidth="7"

                    strokeLinecap="round"

                  />



                  <path

                    d="M151 138 L148 160 M164 138 L171 158"

                    stroke="#315c9e"

                    strokeWidth="8"

                    strokeLinecap="round"

                  />



                  <path

                    d="M142 162 L153 162 M166 160 L177 160"

                    stroke="#273c69"

                    strokeWidth="6"

                    strokeLinecap="round"

                  />



                  <rect

                    x="130"

                    y="121"

                    width="7"

                    height="19"

                    rx="2"

                    fill="#4cbd9b"

                  />



                  <rect

                    x="127"

                    y="137"

                    width="13"

                    height="4"

                    rx="2"

                    fill="#4cbd9b"

                  />

                </svg>

              </div>

            )}



            {!paymentFailed && (

              <p className="figma-email-note">

                You will receive an email confirmation along with the

                details of your order.

              </p>

            )}



            <div className="figma-success-actions">

              {paymentFailed ? (

                <button

                  type="button"

                  className="figma-view-button"

                  onClick={goToCheckout}

                >

                  Try Again

                </button>

              ) : (

                <button

                  type="button"

                  className="figma-view-button"

                  onClick={() => navigate(`/order-details/${orderId}`)}

                >

                  View Orders

                </button>

              )}



              <button

                type="button"

                className="figma-continue-button"

                onClick={() => navigate("/home")}

              >

                CONTINUE SHOPPING

              </button>

            </div>

          </div>



          {/* RIGHT PAYMENT CARD */}

          <aside className="figma-payment-card">

            <div

              className="figma-payment-status-icon"

              style={paymentFailed || cancelled ? failedIconStyle : undefined}

            >

              {paymentFailed || cancelled ? (

                <X size={19} strokeWidth={3} />

              ) : (

                <Check size={19} strokeWidth={3} />

              )}

            </div>



            <h2>{cardTitle}</h2>



            <div className="figma-payment-divider" />



            <div className="figma-payment-row">

              <span>Order Id</span>

              <strong>{String(orderNumber).slice(-16)}</strong>

            </div>



            <div className="figma-payment-row">

              <span>Payment Time</span>

              <strong>{formatDateTime(paymentTime)}</strong>

            </div>



            <div className="figma-payment-row">

              <span>Payment Method</span>

              <strong>{String(paymentMethod).replaceAll("_", " ")}</strong>

            </div>



            <div className="figma-payment-row">

              <span>Payment Status</span>

              <strong>

                {paymentFailed && !successfulPayment

                  ? "Not paid"

                  : paymentStatus}

              </strong>

            </div>



            <div className="figma-payment-row">

              <span>Sender Name</span>

              <strong>{senderName}</strong>

            </div>



            <div className="figma-payment-divider figma-amount-divider" />



            <div className="figma-payment-row figma-amount-row">

              <span>Amount</span>

              <strong>{money(total)}</strong>

            </div>

          </aside>

        </section>

      </div>

    </main>

  );

};



export default OrderResult;
