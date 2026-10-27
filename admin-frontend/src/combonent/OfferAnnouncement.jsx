import React, { useEffect, useState } from "react";
import API from "../Api/axios";
import "./OfferAnnouncement.css";

const OfferAnnouncement = ({ categoryId = null }) => {
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffer();
  }, [categoryId]);

  const fetchOffer = async () => {
    try {
      setLoading(true);

      /*
       * If categoryId exists:
       *   fetch category-specific offer
       *
       * If categoryId does not exist:
       *   fetch common offer
       */

      const response = await API.get("/offers/active", {
        params: {
          categoryId: categoryId || "",
        },
      });

      console.log("ANNOUNCEMENT OFFER:", response.data);

      const offerData =
        response.data?.data ||
        response.data?.offer ||
        null;

      setOffer(offerData);
    } catch (error) {
      console.error(
        "Announcement offer error:",
        error
      );

      setOffer(null);
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything while loading
  if (loading) {
    return null;
  }

  // No active offer
  if (!offer) {
    return null;
  }

  const getDiscountText = () => {
    const discountType =
      String(
        offer.discounttype ||
          offer.discountType ||
          ""
      ).toLowerCase();

    const value =
      offer.discountvalue ??
      offer.discountValue ??
      "";

    if (value === "") {
      return "";
    }

    if (
      discountType === "percentage" ||
      discountType === "percent"
    ) {
      return `${value}% OFF`;
    }

    if (
      discountType === "fixed" ||
      discountType === "amount"
    ) {
      return `₹${value} OFF`;
    }

    return `${value} OFF`;
  };

  const discountText = getDiscountText();

  const offerName =
    offer.offerName ||
    offer.offername ||
    offer.name ||
    "Special Offer";

  return (
    <div className="offer-announcement">

      <div className="offer-announcement-track">

        <div className="offer-announcement-content">

          <span className="offer-announcement-icon">
            ✨
          </span>

          <span className="offer-announcement-name">
            {offerName}
          </span>

          {discountText && (
            <>
              <span className="offer-announcement-separator">
                —
              </span>

              <span className="offer-announcement-discount">
                {discountText}
              </span>
            </>
          )}

          <span className="offer-announcement-dot">
            •
          </span>

          <span className="offer-announcement-message">
            Limited time offer
          </span>

        </div>

      </div>

    </div>
  );
};

export default OfferAnnouncement;