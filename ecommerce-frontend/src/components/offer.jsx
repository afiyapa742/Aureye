
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import API from "../api/axios";
import "./OfferAnnouncement.css";

const OfferAnnouncement = () => {
  const location = useLocation();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchOffer = async () => {
      setLoading(true);
      setError("");
      setOffer(null);

      try {
        const pathParts = location.pathname
          .split("/")
          .filter(Boolean);

        const query = new URLSearchParams(location.search);

        // Category page: /category/:categoryId
        const categoryId =
          (pathParts[0] === "category" ? pathParts[1] : null) ||
          query.get("categoryId");

        // Product detail page
        const productId = [
          "productdetail",
          "product-details",
          "product",
        ].includes(pathParts[0])
          ? pathParts[1]
          : null;

        const params = {};

        if (productId) {
          params.productId = productId;
        } else if (categoryId) {
          params.categoryId = categoryId;
        }

        console.log("OFFER REQUEST PARAMS:", params);

        const response = await API.get("/offers/active", {
          params,
        });

        console.log("FULL OFFER API RESPONSE:", response.data);

        const body = response.data;

        let offerData =
          body?.data?.offer ??
          body?.data ??
          body?.offer ??
          null;

        if (Array.isArray(offerData)) {
          offerData = offerData[0] ?? null;
        }

        console.log("EXTRACTED OFFER:", offerData);

        if (!cancelled) {
          if (
            offerData &&
            typeof offerData === "object" &&
            !Array.isArray(offerData)
          ) {
            setOffer(offerData);
          } else {
            setOffer(null);
            setError("No active offer was returned by the API.");
          }
        }
      } catch (err) {
        console.error(
          "OFFER ANNOUNCEMENT ERROR:",
          err.response?.data || err.message
        );

        if (!cancelled) {
          setOffer(null);
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load offer."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchOffer();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search]);

  // Diagnostic: show loading state visibly
  if (loading) {
    return (
      <div className="offer-diagnostic">
        Loading offer...
      </div>
    );
  }

  // Diagnostic: show the reason the bar is empty
  if (!offer) {
    return (
      <div className="offer-diagnostic">
        {error || "No active offer available."}
      </div>
    );
  }

  // Dynamic offer name
  const offerName =
    offer.offerName ||
    offer.offername ||
    offer.name ||
    "Special Offer";

  // Dynamic discount
  const discountType = String(
    offer.discounttype ?? offer.discountType ?? ""
  ).toLowerCase();

  const discountValue =
    offer.discountvalue ?? offer.discountValue;

  let discountText = "";

  if (
    discountValue !== undefined &&
    discountValue !== null &&
    discountValue !== ""
  ) {
    if (
      discountType === "percentage" ||
      discountType === "percent"
    ) {
      discountText = `${discountValue}% OFF`;
    } else if (
      discountType === "fixed" ||
      discountType === "amount"
    ) {
      discountText = `₹${discountValue} OFF`;
    } else {
      discountText = `${discountValue} OFF`;
    }
  }

  // Dynamic description
  const message =
    offer.description ||
    offer.message ||
    "Shop now and enjoy the offer";

  // Repeated content for continuous scrolling
  const OfferContent = ({ duplicate = false }) => (
    <div
      className="offer-announcement-content"
      aria-hidden={duplicate ? "true" : undefined}
    >
      <span className="offer-icon">✦</span>

      <span className="offer-name">
        {offerName}
      </span>

      {discountText && (
        <>
          <span className="offer-separator">—</span>

          <span className="offer-discount">
            {discountText}
          </span>
        </>
      )}

      <span className="offer-dot">•</span>

      <span className="offer-message">
        {message}
      </span>
    </div>
  );

  return (
    <div className="offer-announcement">
    <div className="offer-announcement-track">
  <OfferContent />
  <OfferContent duplicate />
</div>
    </div>
  );
};

export default OfferAnnouncement;
