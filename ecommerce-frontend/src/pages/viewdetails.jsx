import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import API from "../api/axios";
import "./viewdetails.css";

// ==========================================
// STATUS CONFIG
// ==========================================

const CANCELLABLE_STATUSES = [
  "confirmed",
  "processing",
];


const ViewDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ------------------------------------------
  // Navigation state
  // Individual:
  // { orderId, itemId }
  //
  // View all:
  // { orderId, viewAll: true }
  // ------------------------------------------

  const navigationState =
    location.state || {};

  const orderId =
    navigationState.orderId || "";

  const itemId =
    navigationState.itemId || "";

  const viewAll =
    Boolean(
      navigationState.viewAll
    );

  // ==========================================
  // DATA
  // ==========================================

  const [order, setOrder] =
    useState(null);

  const [item, setItem] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================
  // CUSTOM ALERT POPUP
  // ==========================================

  const [alertPopup, setAlertPopup] = useState({
    open: false,
    message: "",
  });

  const showAlert = (message) => {
    setAlertPopup({
      open: true,
      message,
    });
  };

  const closeAlert = () => {
    setAlertPopup({
      open: false,
      message: "",
    });
  };

  // ==========================================
  // PRODUCT REVIEW STATE
  // ==========================================

  const [showReviewForm, setShowReviewForm] =
    useState(false);

  const [selectedReviewItem, setSelectedReviewItem] =
    useState(null);

  const [reviewRating, setReviewRating] =
    useState(0);

  const [reviewText, setReviewText] =
    useState("");

  const [reviewTitle, setReviewTitle] =
    useState("");

  const [reviewPublicName, setReviewPublicName] =
    useState("");

  const [reviewImage, setReviewImage] =
    useState("");

  const [reviewImageName, setReviewImageName] =
    useState("");

  const [reviewImageError, setReviewImageError] =
    useState("");

  const [reviewSubmitting, setReviewSubmitting] =
    useState(false);

  const [showReviewSuccess, setShowReviewSuccess] =
    useState(false);

  // ==========================================
  // CANCEL POPUP STATE
  // ==========================================

  const [showCancelPopup, setShowCancelPopup] =
    useState(false);

  const [selectedCancelItems, setSelectedCancelItems] =
    useState([]);

  const [cancelReason, setCancelReason] =
    useState("");

  const [cancelReasonError, setCancelReasonError] =
    useState("");

  const [cancelling, setCancelling] =
    useState(false);

  // ==========================================
  // CANCEL SUCCESS
  // ==========================================

  const [showCancelSuccess, setShowCancelSuccess] =
    useState(false);

  const [cancelledItemCount, setCancelledItemCount] =
    useState(0);

  // ==========================================
  // RETURN POPUP STATE
  // ==========================================

  const [showReturnPopup, setShowReturnPopup] =
    useState(false);

  const [selectedReturnItems, setSelectedReturnItems] =
    useState([]);

  const [returnReason, setReturnReason] =
    useState("");

  const [returnReasonError, setReturnReasonError] =
    useState("");

  const [returning, setReturning] =
    useState(false);

  // ==========================================
  // RETURN SUCCESS
  // ==========================================

  const [showReturnSuccess, setShowReturnSuccess] =
    useState(false);

  const [returnedItemCount, setReturnedItemCount] =
    useState(0);

  // ==========================================
  // FETCH ORDER
  // ==========================================

  const fetchOrderDetail = async () => {
    if (!orderId) {
      setError(
        "Order ID is missing"
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await API.get("/myorder");

      const orderList =
        response?.data?.data || [];

      if (!Array.isArray(orderList)) {
        setError(
          "Invalid order response"
        );
        return;
      }

      const selectedOrder =
        orderList.find(
          (currentOrder) =>
            String(
              currentOrder?._id ||
                currentOrder?.id
            ) ===
            String(orderId)
        );

      if (!selectedOrder) {
        setError(
          "Order not found"
        );
        return;
      }

      const orderItems =
        Array.isArray(
          selectedOrder?.items
        )
          ? selectedOrder.items
          : [];

      // In individual mode itemId is required.
      if (!viewAll) {
        if (!itemId) {
          setError(
            "Order item ID is missing"
          );
          return;
        }

        const selectedItem =
          orderItems.find(
            (currentItem) =>
              String(
                currentItem?._id ||
                  currentItem?.id
              ) ===
              String(itemId)
          );

        if (!selectedItem) {
          setError(
            "Order item not found"
          );
          return;
        }

        setItem(
          selectedItem
        );
      } else {
        // View-all mode does not require itemId.
        setItem(null);
      }

      setOrder(
        selectedOrder
      );
    } catch (err) {
      console.error(
        "VIEW DETAILS ERROR:",
        err
      );

      setError(
        err?.response?.data
          ?.message ||
          "Unable to load order details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [
    orderId,
    itemId,
    viewAll,
  ]);

  // ==========================================
  // ALL ORDER ITEMS
  // ==========================================

  const allItems = useMemo(() => {
    return Array.isArray(
      order?.items
    )
      ? order.items
      : [];
  }, [order]);

  // View-all is only a real bulk page
  // when the order contains more than 1 item.
  const isBulkView =
    viewAll &&
    allItems.length > 1;

  // Individual page gets exactly one item.
  const displayItems =
    isBulkView
      ? allItems
      : item
      ? [item]
      : [];

  // ==========================================
  // IMAGE
  // ==========================================

  const getImage = (
    currentItem
  ) => {
    const image =
      currentItem
        ?.variantId
        ?.productImages?.[0]
        ?.imageUrl || "";

    if (!image) {
      return "";
    }

    if (
      String(image).startsWith(
        "http"
      )
    ) {
      return image;
    }

    if (
      String(image).startsWith(
        "/uploads/"
      )
    ) {
      return `http://localhost:5000${image}`;
    }

    return `http://localhost:5000/uploads/${image}`;
  };

  // ==========================================
  // PRODUCT NAME
  // ==========================================

  const getProductName = (
    currentItem
  ) => {
    return (
      currentItem
        ?.productId
        ?.productName ||
      currentItem
        ?.variantId
        ?.variantName ||
      "Product"
    );
  };

  // ==========================================
  // PRICE
  // ==========================================

  const getPrice = (
    currentItem
  ) => {
    return Number(
      currentItem?.price ??
        currentItem
          ?.variantId
          ?.price ??
        0
    );
  };

  // ==========================================
  // QUANTITY
  // ==========================================

  const getQuantity = (
    currentItem
  ) => {
    return Number(
      currentItem?.quantity ||
        1
    );
  };

  // ==========================================
  // STATUS
  // ==========================================


const getStatus = (currentItem) => {
  return String(
    order?.orderstatus ||
      currentItem?.status ||
      "pending"
  ).toLowerCase();
};


  const getStatusLabel = (
    currentStatus
  ) => {
    return String(
      currentStatus
    )
      .replaceAll(
        "_",
        " "
      )
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  // ==========================================
  // DATE
  // ==========================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  // ==========================================
  // CANCEL ELIGIBILITY
  // ==========================================

  const canCancelItem = (
    currentItem
  ) => {
    const currentStatus =
      getStatus(
        currentItem
      );

    return CANCELLABLE_STATUSES.includes(
      currentStatus
    );
  };

  // ==========================================
  // RETURN ELIGIBILITY
  // Only delivered + within 9 days
  // ==========================================

const canReturnItem = (currentItem) => {
  const currentStatus = getStatus(currentItem);

  if (currentStatus !== "delivered") {
    return false;
  }

  const deliveredAt = currentItem?.deliveredAt;

  if (!deliveredAt) {
    return false;
  }

  const deliveredTime = new Date(deliveredAt).getTime();

  if (Number.isNaN(deliveredTime)) {
    return false;
  }

  const returnWindow = 9 * 24 * 60 * 60 * 1000;
  const returnDeadline = deliveredTime + returnWindow;

  return Date.now() < returnDeadline;
};


  // ==========================================
  // ELIGIBLE ITEMS
  // ==========================================

  const cancellableItems =
    useMemo(() => {
      return allItems.filter(
        (currentItem) =>
          canCancelItem(
            currentItem
          )
      );
    }, [
      allItems,
      order,
    ]);

  const returnableItems =
    useMemo(() => {
      return allItems.filter(
        (currentItem) =>
          canReturnItem(
            currentItem
          )
      );
    }, [
      allItems,
      order,
    ]);

  // ==========================================
  // TOTALS
  // ==========================================

  const calculatedItemsTotal =
    allItems.reduce(
      (total, currentItem) =>
        total +
        getPrice(currentItem) *
        getQuantity(currentItem),
      0
    );

  const bulkItemsTotal = Number(
    order?.subtotal ?? calculatedItemsTotal
  );

  const singleItemTotal = item
    ? getPrice(item) * getQuantity(item)
    : 0;

  const deliveryCharge = Number(
    order?.deliverycharge || 0
  );

  const discount = Number(
    order?.discountamount ||
      order?.coupondiscount ||
      0
  );

  const itemsTotal = isBulkView
    ? bulkItemsTotal
    : singleItemTotal;

  const taxableAmount = Math.max(
    itemsTotal - discount,
    0
  );

  // 5% tax, calculated after discount.
  const tax = Number(
    (taxableAmount * 0.05).toFixed(2)
  );

  const calculatedTotal = Math.max(
    taxableAmount +
      deliveryCharge +
      tax,
    0
  );

  const displayedTotal = Number(
    order?.total ?? calculatedTotal
  );

  // Customer-paid amount for each item.
  // Discount, tax and delivery are distributed
  // proportionally when an order has multiple items.
  const getCustomerPaidItemTotal = (currentItem) => {
    const lineTotal =
      getPrice(currentItem) *
      getQuantity(currentItem);

    if (lineTotal <= 0) {
      return 0;
    }

    const orderSubtotal =
      bulkItemsTotal > 0
        ? bulkItemsTotal
        : calculatedItemsTotal;

    const itemShare =
      orderSubtotal > 0
        ? lineTotal / orderSubtotal
        : 0;

    const itemDiscount =
      discount * itemShare;

    const itemTax = tax * itemShare;
    const itemDelivery =
      deliveryCharge * itemShare;

    return Number(
      Math.max(
        lineTotal -
          itemDiscount +
          itemTax +
          itemDelivery,
        0
      ).toFixed(2)
    );
  };

  // ==========================================
  // TRACK INDIVIDUAL ITEM
  // ==========================================

  const handleTrack = (
    currentItem
  ) => {
    const currentItemId =
      currentItem?._id ||
      currentItem?.id;

    if (
      !orderId ||
      !currentItemId
    ) {
      return;
    }

    navigate(
      `/profile/orders/${orderId}/track/${currentItemId}`
    );
  };

  // ==========================================
  // OPEN CANCEL POPUP
  // ==========================================

  const openCancelPopup = (
    itemOrItems
  ) => {
    const itemList =
      Array.isArray(
        itemOrItems
      )
        ? itemOrItems
        : [itemOrItems];

    const ids =
      itemList
        .map(
          (currentItem) =>
            currentItem?._id ||
            currentItem?.id
        )
        .filter(Boolean)
        .map(String);

    if (
      ids.length === 0
    ) {
      return;
    }

    setSelectedCancelItems(
      ids
    );

    setCancelReason("");
    setCancelReasonError("");
    setShowCancelPopup(
      true
    );
  };

  // ==========================================
  // CLOSE CANCEL POPUP
  // ==========================================

  const closeCancelPopup = () => {
    if (cancelling) {
      return;
    }

    setShowCancelPopup(
      false
    );

    setSelectedCancelItems(
      []
    );

    setCancelReason("");
    setCancelReasonError("");
  };

  // ==========================================
  // TOGGLE CANCEL ITEM
  // ==========================================

  const toggleCancelItem = (
    currentItemId
  ) => {
    const id = String(
      currentItemId
    );

    setSelectedCancelItems(
      (currentItems) => {
        if (
          currentItems.includes(
            id
          )
        ) {
          return currentItems.filter(
            (selectedId) =>
              selectedId !== id
          );
        }

        return [
          ...currentItems,
          id,
        ];
      }
    );
  };

  // ==========================================
  // CONFIRM CANCEL
  // ==========================================

  const confirmCancel =
    async () => {
      const reason =
        cancelReason.trim();

      if (!reason) {
        setCancelReasonError(
          "Cancellation reason is required."
        );
        return;
      }

      if (
        selectedCancelItems.length ===
        0
      ) {
        setCancelReasonError(
          "Please select at least one item."
        );
        return;
      }

      try {
        setCancelling(
          true
        );
        setCancelReasonError(
          ""
        );

        let successCount = 0;

        for (
          const currentItemId of selectedCancelItems
        ) {
          try {
           await API.post(
  `/cancel-refund/${orderId}/${currentItemId}`,
  { reason }
), successCount += 1;
          } catch (itemError) {
            console.error(
              "CANCEL ITEM ERROR:",
              currentItemId,
              itemError
            );
          }
        }

        if (
          successCount ===
          0
        ) {
          throw new Error(
            "Unable to cancel the selected item(s)."
          );
        }

        setShowCancelPopup(
          false
        );

        setSelectedCancelItems(
          []
        );

        setCancelReason("");

        setCancelledItemCount(
          successCount
        );

        setShowCancelSuccess(
          true
        );

        await fetchOrderDetail();

      } catch (err) {
        console.error(
          "CANCEL ORDER ERROR:",
          err
        );

        setCancelReasonError(
          err?.response?.data
            ?.message ||
            err?.message ||
            "Unable to cancel the selected item(s)."
        );
      } finally {
        setCancelling(
          false
        );
      }
    };

  // ==========================================
  // CLOSE CANCEL SUCCESS
  // ==========================================

  const closeCancelSuccess =
    () => {
      setShowCancelSuccess(
        false
      );

      setCancelledItemCount(
        0
      );
    };

  // ==========================================
  // OPEN RETURN POPUP
  // ==========================================

  const openReturnPopup = (
    itemOrItems
  ) => {
    const itemList =
      Array.isArray(
        itemOrItems
      )
        ? itemOrItems
        : [itemOrItems];

    const eligibleItems =
      itemList.filter(
        (currentItem) =>
          canReturnItem(
            currentItem
          )
      );

    const ids =
      eligibleItems
        .map(
          (currentItem) =>
            currentItem?._id ||
            currentItem?.id
        )
        .filter(Boolean)
        .map(String);

    if (
      ids.length === 0
    ) {
      return;
    }

    setSelectedReturnItems(
      ids
    );

    setReturnReason("");
    setReturnReasonError("");
    setShowReturnPopup(
      true
    );
  };

  // ==========================================
  // CLOSE RETURN POPUP
  // ==========================================

  const closeReturnPopup = () => {
    if (returning) {
      return;
    }

    setShowReturnPopup(
      false
    );

    setSelectedReturnItems(
      []
    );

    setReturnReason("");
    setReturnReasonError("");
  };

  // ==========================================
  // TOGGLE RETURN ITEM
  // ==========================================

  const toggleReturnItem = (
    currentItemId
  ) => {
    const id = String(
      currentItemId
    );

    setSelectedReturnItems(
      (currentItems) => {
        if (
          currentItems.includes(
            id
          )
        ) {
          return currentItems.filter(
            (selectedId) =>
              selectedId !== id
          );
        }

        return [
          ...currentItems,
          id,
        ];
      }
    );
  };

  // ==========================================
  // CONFIRM RETURN
  // ==========================================

  const confirmReturn =
    async () => {
      const reason =
        returnReason.trim();

      if (!reason) {
        setReturnReasonError(
          "Return reason is required."
        );
        return;
      }

      if (
        selectedReturnItems.length ===
        0
      ) {
        setReturnReasonError(
          "Please select at least one item."
        );
        return;
      }

      try {
        setReturning(true);
        setReturnReasonError("");

        if (
          selectedReturnItems.length ===
          1
        ) {
          await API.put(
            `/myorder/order-item/return/${selectedReturnItems[0]}`,
            {
              reason,
            }
          );
        } else {
          await API.put(
            "/myorder/order-items/return",
            {
              itemIds:
                selectedReturnItems,
              reason,
            }
          );
        }

        const count =
          selectedReturnItems.length;

        setShowReturnPopup(
          false
        );

        setSelectedReturnItems(
          []
        );

        setReturnReason("");

        setReturnedItemCount(
          count
        );

        setShowReturnSuccess(
          true
        );

        await fetchOrderDetail();

      } catch (err) {
        console.error(
          "RETURN ITEM ERROR:",
          err?.response?.data ||
            err
        );

        setReturnReasonError(
          err?.response?.data
            ?.message ||
            "Unable to submit return request."
        );
      } finally {
        setReturning(
          false
        );
      }
    };

  // ==========================================
  // CLOSE RETURN SUCCESS
  // ==========================================

  const closeReturnSuccess =
    () => {
      setShowReturnSuccess(
        false
      );

      setReturnedItemCount(
        0
      );
    };

  // ==========================================
  // PRODUCT REVIEW HELPERS
  // ==========================================

  const getReviewProductId = (
    currentItem
  ) => {
    return (
      currentItem?.productId?._id ||
      currentItem?.productId?.id ||
      currentItem?.productId ||
      ""
    );
  };

  const getReviewVariantId = (
    currentItem
  ) => {
    return (
      currentItem?.variantId?._id ||
      currentItem?.variantId?.id ||
      currentItem?.variantId ||
      ""
    );
  };

  const getStoredPublicName = () => {
    const possibleKeys = [
      "user",
      "userData",
      "currentUser",
      "profile",
    ];

    for (const key of possibleKeys) {
      try {
        const raw =
          localStorage.getItem(key);

        if (!raw) {
          continue;
        }

        const parsed =
          JSON.parse(raw);

        const name =
          parsed?.FullName ||
          parsed?.fullName ||
          parsed?.name ||
          parsed?.username ||
          "";

        if (String(name).trim()) {
          return String(name).trim();
        }
      } catch (storageError) {
        console.error(
          "PUBLIC NAME READ ERROR:",
          storageError
        );
      }
    }

    return "";
  };

  const getStoredReviews = () => {
    try {
      const raw =
        localStorage.getItem(
          "productReviews"
        );

      if (!raw) {
        return [];
      }

      const parsed =
        JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch (storageError) {
      console.error(
        "REVIEW STORAGE READ ERROR:",
        storageError
      );

      return [];
    }
  };

  const openReviewForm = (
    currentItem
  ) => {
    if (
      getStatus(currentItem) !==
      "delivered"
    ) {
      return;
    }

    setSelectedReviewItem(
      currentItem
    );

    setReviewRating(0);
    setReviewText("");
    setReviewTitle("");
    setReviewPublicName(
      getStoredPublicName()
    );
    setReviewImage("");
    setReviewImageName("");
    setReviewImageError("");
    setShowReviewForm(true);
  };

  const closeReviewForm = () => {
    if (reviewSubmitting) {
      return;
    }

    setShowReviewForm(false);
    setSelectedReviewItem(null);
    setReviewRating(0);
    setReviewText("");
    setReviewTitle("");
    setReviewPublicName("");
    setReviewImage("");
    setReviewImageName("");
    setReviewImageError("");
  };

  const handleReviewImageChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    setReviewImageError("");
    setReviewImage("");
    setReviewImageName("");

    if (!file) {
      return;
    }

    if (
      !String(file.type).startsWith(
        "image/"
      )
    ) {
      setReviewImageError(
        "Please select an image file."
      );
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setReviewImageError(
        "Image size must be 5 MB or less."
      );
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      setReviewImage(
        typeof reader.result ===
          "string"
          ? reader.result
          : ""
      );

      setReviewImageName(
        file.name
      );
    };

    reader.onerror = () => {
      setReviewImageError(
        "Unable to read the selected image."
      );
    };

    reader.readAsDataURL(file);
  };

  const submitProductReview = () => {
    if (!selectedReviewItem) {
      return;
    }

    if (reviewRating < 1) {
      showAlert("Please select a star rating.");
      return;
    }

    if (!reviewTitle.trim()) {
      showAlert("Please enter a review title.");
      return;
    }

    if (!reviewPublicName.trim()) {
      showAlert("Please enter your public name.");
      return;
    }

    const productId =
      getReviewProductId(
        selectedReviewItem
      );

    if (!productId) {
      showAlert("Product information is missing.");
      return;
    }

    try {
      setReviewSubmitting(true);

      const reviews =
        getStoredReviews();

      const review = {
        id: `${Date.now()}-${Math.random()}`,
        orderId,
        productId:
          String(productId),
        variantId: String(
          getReviewVariantId(
            selectedReviewItem
          ) || ""
        ),
        productName:
          getProductName(
            selectedReviewItem
          ),
        rating: reviewRating,
        reviewText:
          reviewText.trim(),
        title:
          reviewTitle.trim(),
        publicName:
          reviewPublicName.trim(),
        image:
          reviewImage || "",
        imageName:
          reviewImageName || "",
        createdAt:
          new Date().toISOString(),
      };

      localStorage.setItem(
        "productReviews",
        JSON.stringify([
          review,
          ...reviews,
        ])
      );

      setShowReviewForm(false);
      setShowReviewSuccess(true);
    } catch (reviewError) {
      console.error(
        "SUBMIT REVIEW ERROR:",
        reviewError
      );

      showAlert("Unable to submit your review. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleBuyAgain = (
    currentItem
  ) => {
    const productId =
      getReviewProductId(
        currentItem
      );

    if (!productId) {
      return;
    }

    navigate(
      `/productdetail/${productId}`
    );
  };

  const closeReviewSuccess = () => {
    const productId =
      getReviewProductId(
        selectedReviewItem
      );

    setShowReviewSuccess(false);
    setSelectedReviewItem(null);
    setReviewRating(0);
    setReviewText("");
    setReviewTitle("");
    setReviewPublicName("");
    setReviewImage("");
    setReviewImageName("");
    setReviewImageError("");

    if (productId) {
      navigate(
        `/productdetail/${productId}`,
        {
          state: {
            activeTab: "review",
            reviewSubmitted: true,
          },
        }
      );

      return;
    }

    navigate(
      "/profile/orders"
    );
  };

  // ==========================================
  // INVOICE
  // ==========================================

  const handleInvoice = async (currentItemId) => {
    if (!orderId || (!isBulkView && !currentItemId)) {
      return;
    }

    const invoiceWindow = window.open("", "_blank");

    if (!invoiceWindow) {
      showAlert("Please allow pop-ups to open your invoice.");
      return;
    }

    invoiceWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Invoice</title></head>
        <body style="
          margin:0;
          display:flex;
          align-items:center;
          justify-content:center;
          height:100vh;
          font-family:Arial,sans-serif;
        ">
          <div>Loading invoice...</div>
        </body>
      </html>
    `);

    try {
      // Bulk order: request one invoice for the complete order.
      // Individual order item: keep the existing item invoice endpoint.
      const invoiceEndpoint = isBulkView
        ? `/myorder/order/${orderId}/invoice`
        : `/myorder/order/${orderId}/invoice/${currentItemId}`;

      const response = await API.get(invoiceEndpoint, {
        responseType: "blob",
      });

      const contentType = response.headers?.["content-type"] || "";

      if (!contentType.toLowerCase().includes("application/pdf")) {
        invoiceWindow.close();
        showAlert("The invoice could not be generated. Please try again.");
        return;
      }

      const pdfBlob = new Blob([response.data], {
        type: "application/pdf",
      });

      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      invoiceWindow.location.replace(pdfUrl);

      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 5 * 60 * 1000);
    } catch (err) {
      console.error("INVOICE ERROR:", err);
      invoiceWindow.close();
      showAlert(
        err?.response?.data?.message ||
          "Unable to open the invoice. Please try again."
      );
    }
  };

  // ==========================================
  // BACK
  // ==========================================

  const handleBack =
    () => {
      navigate(
        "/profile/orders"
      );
    };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="view-details-page">
        <div className="order-detail-loading">
          Loading order details...
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (
    error ||
    !order ||
    displayItems.length ===
      0
  ) {
    return (
      <div className="view-details-page">
        <div className="order-detail-error">

          <h2>
            Order Details
          </h2>

          <p>
            {error ||
              "Order details not found"}
          </p>

          <button
            type="button"
            onClick={
              handleBack
            }
          >
            Back to My Orders
          </button>

        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="view-details-page">
      <div className="order-detail-container">

        {/* PAGE HEADER */}

        <div className="order-detail-topbar">
          <h1>
            Order Details
          </h1>
        </div>

        {/* ======================================
            MAIN ORDER CARD
        ======================================= */}

        <div
          className={`order-detail-card ${
            isBulkView
              ? "bulk-order-detail-card"
              : "single-order-detail-card"
          }`}
        >

          {/* ====================================
              PRODUCTS
          ===================================== */}

          <div className="order-detail-left">

            {displayItems.map(
              (
                currentItem,
                index
              ) => {

                const currentItemId =
                  currentItem?._id ||
                  currentItem?.id;

                const currentStatus =
                  getStatus(
                    currentItem
                  );

                const currentPrice =
                  getPrice(
                    currentItem
                  );

                const currentQuantity =
                  getQuantity(
                    currentItem
                  );

                const currentBaseTotal =
                  currentPrice *
                  currentQuantity;

                const currentCustomerPaidTotal =
                  getCustomerPaidItemTotal(
                    currentItem
                  );

                const currentCustomerPaidPrice =
                  currentQuantity > 0
                    ? currentCustomerPaidTotal /
                      currentQuantity
                    : currentCustomerPaidTotal;

                return (
                  <div
                    className={`view-detail-product ${
                      index ===
                      displayItems.length -
                        1
                        ? "last-product"
                        : ""
                    }`}
                    key={
                      currentItemId ||
                      index
                    }
                  >

                    {/* IMAGE */}

                    <div className="order-detail-product-image">

                      {getImage(
                        currentItem
                      ) ? (
                        <img
                          src={getImage(
                            currentItem
                          )}
                          alt={getProductName(
                            currentItem
                          )}
                        />
                      ) : (
                        <div className="order-detail-no-image">
                          No Image
                        </div>
                      )}

                    </div>

                    {/* PRODUCT INFORMATION */}

                    <div className="order-detail-product-info">

                      <h2>
                        {getProductName(
                          currentItem
                        )}
                      </h2>

                      <p className="order-detail-variant">
                        {
                          currentItem
                            ?.variantId
                            ?.variantName ||
                          "Product"
                        }
                      </p>

                      <div className="order-detail-info-row">
                        <span>
                          Size
                        </span>

                        <strong>
                          {
                            currentItem
                              ?.variantId
                              ?.size ||
                            "-"
                          }
                        </strong>
                      </div>

                      <div className="order-detail-info-row">
                        <span>
                          Color
                        </span>

                        <strong>
                          {
                            currentItem
                              ?.variantId
                              ?.color ||
                            "-"
                          }
                        </strong>
                      </div>

                      <div className="order-detail-info-row">
                        <span>
                          Quantity
                        </span>

                        <strong>
                          {
                            currentQuantity
                          }
                        </strong>
                      </div>

                      <div className="order-detail-info-row">
                        <span>
                          Price
                        </span>

                        <strong>
                          ₹
                          {currentCustomerPaidPrice.toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </strong>
                      </div>

                      <div className="order-detail-info-row">
                        <span>
                          Discount
                        </span>

                        <strong>
                          - ₹
                          {(discount *
                            (bulkItemsTotal > 0
                              ? currentBaseTotal / bulkItemsTotal
                              : 0)
                          ).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </strong>
                      </div>

                      <div className="order-detail-info-row">
                        <span>
                          Tax
                        </span>

                        <strong>
                          ₹
                          {(tax *
                            (bulkItemsTotal > 0
                              ? currentBaseTotal / bulkItemsTotal
                              : 0)
                          ).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </strong>
                      </div>

                      <div className="order-detail-info-row">
                        <span>
                          Delivery
                        </span>

                        <strong>
                          ₹
                          {(deliveryCharge *
                            (bulkItemsTotal > 0
                              ? currentBaseTotal / bulkItemsTotal
                              : 0)
                          ).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </strong>
                      </div>

                      <div className="order-detail-info-row">
                        <span>
                          Customer Paid
                        </span>

                        <strong>
                          ₹
                          {currentCustomerPaidTotal.toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </strong>
                      </div>

                      <div className="order-detail-status">
                        Status :

                        <span
                          className={`status-badge status-${currentStatus}`}
                        >
                          {
                            getStatusLabel(
                              currentStatus
                            )
                          }
                        </span>
                      </div>

                      {currentStatus ===
                        "delivered" &&
                        currentItem?.deliveredAt && (
                          <div className="order-detail-delivered">
                            Delivered{" "}
                            {formatDate(
                              currentItem.deliveredAt
                            )}
                          </div>
                        )}

                    </div>

                    {/* ITEM ACTIONS */}

                    {isBulkView && (
                      <div className="view-product-actions">

                        {canCancelItem(
                          currentItem
                        ) && (
                          <button
                            type="button"
                            className="product-cancel-button"
                            onClick={() =>
                              openCancelPopup(
                                currentItem
                              )
                            }
                          >
                            Cancel
                          </button>
                        )}

                        {canReturnItem(
                          currentItem
                        ) && (
                          <button
                            type="button"
                            className="product-return-button"
                            onClick={() =>
                              openReturnPopup(
                                currentItem
                              )
                            }
                          >
                            Return
                          </button>
                        )}

                        <button
                          type="button"
                          className="product-track-button"
                          onClick={() =>
                            handleTrack(
                              currentItem
                            )
                          }
                        >
                          Track Order
                        </button>

                      </div>
                    )}

                  </div>
                );
              }
            )}

          </div>

          {/* ====================================
              MIDDLE INFORMATION
          ===================================== */}

          <div className="order-detail-middle">

            <div className="detail-section">

              <h3>
                Shipping Address
              </h3>

              <p>
                <strong>
                  {
                    order?.address
                      ?.name ||
                    "Customer Name"
                  }
                </strong>
              </p>

              <p>
                {
                  order?.address
                    ?.address ||
                  "Address"
                }
              </p>

              <p>
                State - Pin Code
              </p>

              <p>
                Pin Code :{" "}
                {
                  order?.address
                    ?.pincode ||
                  "-"
                }
              </p>

            </div>

            <div className="detail-section">

              <h3>
                Payment Method
              </h3>

              <p className="payment-method">
                {
                  {
                    COD:
                      "Cash on Delivery",
                    ONLINE:
                      "Online Payment",
                    WALLET:
                      "Wallet",
                  }[
                    String(
                      order?.paymentmethod ||
                        ""
                    ).toUpperCase()
                  ] ||
                  order?.paymentmethod ||
                  "-"
                }
              </p>

              <p className="payment-status">
                {
                  String(
                    order?.paymentstatus ||
                      "pending"
                  )
                    .replaceAll(
                      "_",
                      " "
                    )
                    .toUpperCase()
                }
              </p>

            </div>

            <div className="detail-section">

              <h3>
                Order Date
              </h3>

              <p>
                {
                  formatDate(
                    order?.createdAt
                  )
                }
              </p>

            </div>

          </div>

          {/* ====================================
              ORDER SUMMARY
          ===================================== */}

          <div className="order-detail-summary">

            <h3>
              Order Summary
            </h3>

            <div className="summary-row">

              <span>
                Items Total
              </span>

              <strong>
                ₹
                {itemsTotal.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

            {discount >
              0 && (
              <div className="summary-row summary-discount">

                <span>
                  Discount
                </span>

                <strong>
                  - ₹
                  {discount.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>
            )}

            <div className="summary-row">

              <span>
                Delivery Charge
              </span>

              <strong>
                {deliveryCharge ===
                0
                  ? "Free"
                  : `₹${deliveryCharge.toLocaleString(
                      "en-IN"
                    )}`}
              </strong>

            </div>

            <div className="summary-row">

              <span>
                Tax
              </span>

              <strong>
                ₹
                {tax.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  }
                )}
              </strong>

            </div>

            <div className="summary-line" />

            <div className="summary-row summary-total">

              <span>
                Total
              </span>

              <strong>
                ₹
                {calculatedTotal.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

            <div className="summary-grand-line" />

            <div className="summary-grand-total">

              <span>
                Customer Paid
              </span>

              <strong>
                ₹
                {displayedTotal.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

          </div>

        </div>

        {/* ======================================
            PRODUCT REVIEW / BUY AGAIN
            ONLY FOR DELIVERED INDIVIDUAL ITEM
        ======================================= */}

        {!isBulkView &&
          item &&
          getStatus(item) ===
            "delivered" && (
            <div className="view-details-review-section">

              <div className="view-details-review-heading">
                How's your item?
              </div>

              <div className="view-details-review-product">

                <div className="view-details-review-image">
                  {getImage(item) ? (
                    <img
                      src={getImage(item)}
                      alt={getProductName(item)}
                    />
                  ) : (
                    <span>No image</span>
                  )}
                </div>

                <div className="view-details-review-product-info">
                  <strong>
                    {getProductName(item)}
                  </strong>

                  <span>
                    {item?.variantId?.variantName ||
                      "Product"}
                  </span>
                </div>

              </div>

              <div className="view-details-review-actions">

                <button
                  type="button"
                  className="view-details-buy-again-button"
                  onClick={() =>
                    handleBuyAgain(item)
                  }
                >
                  Buy it again
                </button>

                <button
                  type="button"
                  className="view-details-write-review-button"
                  onClick={() =>
                    openReviewForm(item)
                  }
                >
                  Write a product review
                </button>

              </div>

            </div>
          )}

        {/* ======================================
            COMMON ACTIONS FOR 2+ ITEMS
        ======================================= */}

        {isBulkView && (
          <div className="common-order-actions">

            <div className="common-order-info">

              <strong>
                {displayItems.length} Items
              </strong>

              <span>
                Each item can be cancelled,
                returned or tracked
                individually.
              </span>

            </div>

            <div className="common-order-buttons">

              <button
                type="button"
                className="product-invoice-button"
                onClick={() => handleInvoice()}
              >
                Invoice for Entire Order
              </button>

              {cancellableItems.length >
                0 && (
                <button
                  type="button"
                  className="common-cancel-button"
                  onClick={() =>
                    openCancelPopup(
                      cancellableItems
                    )
                  }
                >
                  Cancel All 
                </button>
              )}

              {returnableItems.length >
                0 && (
                <button
                  type="button"
                  className="common-return-button"
                  onClick={() =>
                    openReturnPopup(
                      returnableItems
                    )
                  }
                >
                  Return All Eligible
                </button>
              )}

            </div>

          </div>
        )}

        {/* ======================================
            SINGLE ITEM ACTIONS
        ======================================= */}

        {!isBulkView && (
          <div className="single-order-actions">

            {item && (
              <button
                type="button"
                className="product-invoice-button"
                onClick={() => handleInvoice(item?._id || item?.id)}
              >
                Invoice
              </button>
            )}

            {canCancelItem(
              item
            ) && (
              <button
                type="button"
                className="order-cancel-button"
                onClick={() =>
                  openCancelPopup(
                    item
                  )
                }
              >
                Cancel Order
              </button>
            )}

            {canReturnItem(
              item
            ) && (
              <button
                type="button"
                className="order-return-button"
                onClick={() =>
                  openReturnPopup(
                    item
                  )
                }
              >
                Return Item
              </button>
            )}

            <button
              type="button"
              className="order-track-button"
              onClick={() =>
                handleTrack(
                  item
                )
              }
            >
              Track Order
            </button>

          </div>
        )}

        {/* ORDER ID */}

        <div className="order-detail-order-id">

          Order ID :{" "}

          <span>
            {
              order?.orderId ||
              order?._id ||
              orderId
            }
          </span>

        </div>

      </div>

      {/* ==========================================
          PRODUCT REVIEW FORM
      ========================================== */}

      {showReviewForm && (
        <div
          className="product-review-overlay"
          onClick={closeReviewForm}
        >
          <div
            className="product-review-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="product-review-close"
              onClick={closeReviewForm}
              disabled={reviewSubmitting}
              aria-label="Close review"
            >
              ×
            </button>

            <div className="product-review-product">
              <div className="product-review-product-image">
                {selectedReviewItem &&
                getImage(
                  selectedReviewItem
                ) ? (
                  <img
                    src={getImage(
                      selectedReviewItem
                    )}
                    alt={getProductName(
                      selectedReviewItem
                    )}
                  />
                ) : (
                  <span>
                    No image
                  </span>
                )}
              </div>

              <div>
                <h2>
                  How was the item?
                </h2>

                <p>
                  {selectedReviewItem
                    ? getProductName(
                        selectedReviewItem
                      )
                    : "Product"}
                </p>
              </div>
            </div>

            <div className="product-review-stars">
              {[1, 2, 3, 4, 5].map(
                (star) => (
                  <button
                    key={star}
                    type="button"
                    className={
                      star <=
                      reviewRating
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setReviewRating(
                        star
                      )
                    }
                    aria-label={`${star} star${
                      star > 1
                        ? "s"
                        : ""
                    }`}
                  >
                    ★
                  </button>
                )
              )}
            </div>

            <label className="product-review-label">
              Write a review
            </label>

            <textarea
              className="product-review-textarea"
              value={reviewText}
              onChange={(event) =>
                setReviewText(
                  event.target.value
                )
              }
              placeholder="What should other customers know?"
              rows={5}
              disabled={reviewSubmitting}
            />

            <label className="product-review-label">
              Share a photo
            </label>

            <label className="product-review-image-box">
              {reviewImage ? (
                <div className="product-review-image-preview-wrap">
                  <img
                    src={reviewImage}
                    alt="Review preview"
                    className="product-review-image-preview"
                  />

                  <span>
                    {reviewImageName}
                  </span>
                </div>
              ) : (
                <span className="product-review-image-placeholder">
                  + Add photo
                </span>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleReviewImageChange
                }
                disabled={
                  reviewSubmitting
                }
              />
            </label>

            {reviewImageError && (
              <p className="product-review-image-error">
                {reviewImageError}
              </p>
            )}

            <label className="product-review-label">
              Title your review
              <span>
                {" "}
                (required)
              </span>
            </label>

            <input
              type="text"
              className="product-review-input"
              value={reviewTitle}
              onChange={(event) =>
                setReviewTitle(
                  event.target.value
                )
              }
              placeholder="What's most important to know?"
              disabled={reviewSubmitting}
            />

            <label className="product-review-label">
              What's your public name?
              <span>
                {" "}
                (required)
              </span>
            </label>

            <input
              type="text"
              className="product-review-input"
              value={reviewPublicName}
              onChange={(event) =>
                setReviewPublicName(
                  event.target.value
                )
              }
              placeholder="Enter your public name"
              disabled={reviewSubmitting}
            />

            <div className="product-review-buttons">
              <button
                type="button"
                className="product-review-cancel-button"
                onClick={closeReviewForm}
                disabled={
                  reviewSubmitting
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="product-review-submit-button"
                onClick={
                  submitProductReview
                }
                disabled={
                  reviewSubmitting ||
                  reviewRating <
                    1 ||
                  !reviewTitle.trim() ||
                  !reviewPublicName.trim()
                }
              >
                {reviewSubmitting
                  ? "Submitting..."
                  : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          PRODUCT REVIEW SUCCESS POPUP
      ========================================== */}

      {showReviewSuccess && (
        <div className="product-review-success-overlay">
          <div className="product-review-success-popup">

            <div className="product-review-success-icon">
              ✓
            </div>

            <h2>
              Review Submitted
            </h2>

            <p>
              Your product review has
              been submitted successfully.
            </p>

            <button
              type="button"
              className="product-review-success-button"
              onClick={
                closeReviewSuccess
              }
            >
              View Product Reviews
            </button>

          </div>
        </div>
      )}

      {/* ==========================================
          CANCEL POPUP
      ========================================== */}

      {showCancelPopup && (
        <div
          className="action-popup-overlay"
          onClick={
            closeCancelPopup
          }
        >

          <div
            className="action-popup"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="action-popup-close"
              onClick={
                closeCancelPopup
              }
              disabled={
                cancelling
              }
            >
              ×
            </button>

            <div className="action-popup-icon cancel-icon">
              !
            </div>

            <h2>
              {
                selectedCancelItems.length >
                1
                  ? "Cancel Items"
                  : "Cancel Order"
              }
            </h2>

            <p className="action-popup-message">
              {
                selectedCancelItems.length >
                1
                  ? "Select the items you want to cancel and provide one reason."
                  : "Please provide a reason for cancelling this order item."
              }
            </p>

            {selectedCancelItems.length >
              1 && (
              <div className="action-popup-item-list">

                {cancellableItems.map(
                  (
                    currentItem
                  ) => {

                    const currentId =
                      String(
                        currentItem?._id ||
                          currentItem?.id
                      );

                    const checked =
                      selectedCancelItems.includes(
                        currentId
                      );

                    return (
                      <label
                        key={
                          currentId
                        }
                        className={`action-popup-item ${
                          checked
                            ? "selected"
                            : ""
                        }`}
                      >

                        <input
                          type="checkbox"
                          checked={
                            checked
                          }
                          onChange={() =>
                            toggleCancelItem(
                              currentId
                            )
                          }
                          disabled={
                            cancelling
                          }
                        />

                        <span className="action-popup-check">
                          ✓
                        </span>

                        <span>
                          {
                            getProductName(
                              currentItem
                            )
                          }
                        </span>

                      </label>
                    );
                  }
                )}

              </div>
            )}

            {selectedCancelItems.length ===
              1 && (
              <div className="action-popup-product-name">

                {
                  getProductName(
                    allItems.find(
                      (
                        currentItem
                      ) =>
                        String(
                          currentItem?._id ||
                            currentItem?.id
                        ) ===
                        String(
                          selectedCancelItems[0]
                        )
                    ) || {}
                  )
                }

              </div>
            )}

            <label
              className="action-popup-label"
              htmlFor="cancelReason"
            >

              Cancellation Reason

              <span>
                *
              </span>

            </label>

            <textarea
              id="cancelReason"
              value={
                cancelReason
              }
              onChange={(event) => {
                setCancelReason(
                  event.target.value
                );

                if (
                  event.target.value.trim()
                ) {
                  setCancelReasonError(
                    ""
                  );
                }
              }}
              placeholder="Please provide your cancellation reason..."
              rows={4}
              disabled={
                cancelling
              }
            />

            {cancelReasonError && (
              <p className="action-popup-error">
                {
                  cancelReasonError
                }
              </p>
            )}

            <div className="action-popup-buttons">

              <button
                type="button"
                className="action-popup-keep"
                onClick={
                  closeCancelPopup
                }
                disabled={
                  cancelling
                }
              >
                No, Keep Order
              </button>

              <button
                type="button"
                className="action-popup-confirm cancel-confirm"
                onClick={
                  confirmCancel
                }
                disabled={
                  cancelling ||
                  !cancelReason.trim() ||
                  selectedCancelItems.length ===
                    0
                }
              >
                {cancelling
                  ? "Cancelling..."
                  : "Yes, Cancel"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ==========================================
          CANCEL SUCCESS POPUP
      ========================================== */}

      {showCancelSuccess && (
        <div className="action-success-overlay">

          <div className="action-success-popup">

            <div className="action-success-icon">
              ✓
            </div>

            <h2>
              Cancellation Successful
            </h2>

            <p>
              {cancelledItemCount ===
              1
                ? "The order item has been cancelled successfully."
                : `${cancelledItemCount} order items have been cancelled successfully.`}
            </p>

            <button
              type="button"
              className="action-success-button"
              onClick={
                closeCancelSuccess
              }
            >
              OK
            </button>

          </div>

        </div>
      )}

      {/* ==========================================
          RETURN POPUP
      ========================================== */}

      {showReturnPopup && (
        <div
          className="action-popup-overlay"
          onClick={
            closeReturnPopup
          }
        >

          <div
            className="action-popup"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="action-popup-close"
              onClick={
                closeReturnPopup
              }
              disabled={
                returning
              }
            >
              ×
            </button>

            <div className="action-popup-icon return-icon">
              ↩
            </div>

            <h2>
              {
                selectedReturnItems.length >
                1
                  ? "Return Items"
                  : "Return Item"
              }
            </h2>

            <p className="action-popup-message">
              Select the item(s) and provide
              one mandatory return reason.
            </p>

            <div className="action-popup-item-list">

              {returnableItems.map(
                (
                  currentItem
                ) => {

                  const currentId =
                    String(
                      currentItem?._id ||
                        currentItem?.id
                    );

                  const checked =
                    selectedReturnItems.includes(
                      currentId
                    );

                  return (
                    <label
                      key={
                        currentId
                      }
                      className={`action-popup-item ${
                        checked
                          ? "selected"
                          : ""
                      }`}
                    >

                      <input
                        type="checkbox"
                        checked={
                          checked
                        }
                        onChange={() =>
                          toggleReturnItem(
                            currentId
                          )
                        }
                        disabled={
                          returning
                        }
                      />

                      <span className="action-popup-check">
                        ✓
                      </span>

                      <span>
                        {
                          getProductName(
                            currentItem
                          )
                        }
                      </span>

                    </label>
                  );
                }
              )}

            </div>

            <label
              className="action-popup-label"
              htmlFor="returnReason"
            >

              Return Reason

              <span>
                *
              </span>

            </label>

            <textarea
              id="returnReason"
              value={
                returnReason
              }
              onChange={(event) => {
                setReturnReason(
                  event.target.value
                );

                if (
                  event.target.value.trim()
                ) {
                  setReturnReasonError(
                    ""
                  );
                }
              }}
              placeholder="Please provide your return reason..."
              rows={4}
              disabled={
                returning
              }
            />

            {returnReasonError && (
              <p className="action-popup-error">
                {
                  returnReasonError
                }
              </p>
            )}

            <div className="action-popup-buttons">

              <button
                type="button"
                className="action-popup-keep"
                onClick={
                  closeReturnPopup
                }
                disabled={
                  returning
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="action-popup-confirm return-confirm"
                onClick={
                  confirmReturn
                }
                disabled={
                  returning ||
                  !returnReason.trim() ||
                  selectedReturnItems.length ===
                    0
                }
              >
                {returning
                  ? "Submitting..."
                  : "Submit Return"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ==========================================
          RETURN SUCCESS POPUP
      ========================================== */}

      {showReturnSuccess && (
        <div className="action-success-overlay">

          <div className="action-success-popup">

            <div className="action-success-icon return-success">
              ✓
            </div>

            <h2>
              Return Request Submitted
            </h2>

            <p>
              {returnedItemCount ===
              1
                ? "Your return request has been submitted successfully."
                : `Return requests for ${returnedItemCount} items have been submitted successfully.`}
            </p>

            <button
              type="button"
              className="action-success-button"
              onClick={
                closeReturnSuccess
              }
            >
              OK
            </button>

          </div>

        </div>
      )}

      {/* CUSTOM ALERT POPUP */}
      {alertPopup.open && (
        <div
          className="custom-alert-overlay"
          onClick={closeAlert}
          role="presentation"
        >
          <div
            className="custom-alert-popup"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="custom-alert-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="custom-alert-icon">!</div>
            <h2 id="custom-alert-title">Notice</h2>
            <p>{alertPopup.message}</p>
            <button
              type="button"
              className="custom-alert-button"
              onClick={closeAlert}
              autoFocus
            >
              OK
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ViewDetails;
