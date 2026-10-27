
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import "./offerpopup.css";
import offerImage from "../assets/offer.png";

const OfferAnnouncements = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!["/", "/home"].includes(location.pathname)) {
      setOffer(null);
      return;
    }

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("userToken");

    if (!token) {
      setOffer(null);
      return;
    }

    let cancelled = false;

    const fetchNextOffer = async () => {
      setLoading(true);

      try {
        const response = await API.get("/offers/next-for-user");

        if (cancelled) return;

        const body = response.data;
        const data = body?.data ?? body;
        const offerData = data?.offer ?? data;

        if (
          body?.success === false ||
          !offerData ||
          typeof offerData !== "object"
        ) {
          setOffer(null);
          return;
        }

        setOffer(offerData);
      } catch (error) {
        if (!cancelled) {
          setOffer(null);
          console.error(
            "Failed to load the next offer:",
            error.response?.data || error.message
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchNextOffer();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const closePopup = () => {
    setOffer(null);
  };



const goToOffer = () => {
  if (!offer) return;

  const type = String(
    offer.offerType || offer.offer_type || ""
  ).toLowerCase();

  console.log("SHOP NOW OFFER:", offer);
  console.log("SHOP NOW TYPE:", type);

  if (type === "common") {
    closePopup();
    navigate("/home");
    return;
  }

  if (type === "category") {
    const categoryId =
      typeof offer.categoryId === "object"
        ? offer.categoryId?._id
        : offer.categoryId;

    if (!categoryId) {
      console.error("Category ID missing:", offer);
      return;
    }

    closePopup();
    navigate(`/category/${categoryId}`);
    return;
  }

  if (type === "product") {
    const productId =
      typeof offer.productId === "object"
        ? offer.productId?._id
        : offer.productId;

    if (!productId) {
      console.error("Product ID missing:", offer);
      return;
    }

    closePopup();
    navigate(`/productdetail/${productId}`);
    return;
  }

  console.error(
    "Unknown offer type. Check the backend response:",
    offer
  );
};



  useEffect(() => {
    if (!offer) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closePopup();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [offer]);

  if (loading || !offer) return null;

  const discountType = String(
    offer.discountType || offer.discounttype || ""
  ).toLowerCase();

  const discountValue =
    offer.discountValue ?? offer.discountvalue ?? 25;

  const discountText =
    discountType === "percentage"
      ? `FLAT ${discountValue}% OFF`
      : discountType === "fixed"
        ? `FLAT ₹${discountValue} OFF`
        : `FLAT ${discountValue}% OFF`;

  return (
    <div
      className="aureya-offer-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closePopup();
        }
      }}
    >
      <section
        className="aureya-offer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aureya-offer-title"
      >
        <img
          className="aureya-offer-background"
          src={offerImage}
          alt="Aureya fashion collection with heels, flats, slides and gift boxes"
        />

        <button
          className="aureya-offer-close"
          type="button"
          aria-label="Close offer"
          onClick={closePopup}
        >
          ×
        </button>

        <div className="aureya-offer-content">
          <p className="aureya-offer-eyebrow">
            EXCLUSIVELY FOR YOU
          </p>

          <h2 id="aureya-offer-title">
            Special
            <br />
            Gift Offer
          </h2>

          <div className="aureya-offer-discount">
            {discountText}
          </div>

          <p className="aureya-offer-description">
            {offer.description || "ON ALL PRODUCTS"}
          </p>

          {Number(offer.minPurchase) > 0 && (
            <p className="aureya-offer-condition">
              On purchases above ₹{offer.minPurchase}
            </p>
          )}

          <button
            className="aureya-offer-shop-button"
            type="button"
            onClick={goToOffer}
          >
            SHOP NOW <span aria-hidden="true">→</span>
          </button>

          <p className="aureya-offer-footer">
            Limited-time offer. Terms and conditions apply.
          </p>
        </div>
      </section>
    </div>
  );
};

export default OfferAnnouncements;
