const couponRepository = require("../repositories/coupon");

// ==========================================
// CREATE COUPON
// ==========================================

const createCoupon = async (couponData) => {
  let {
    userId,
    code,
    couponType,
    discounttype,
    discountvalue,
    minorderAmount,
    maxdiscountAmount,
    usespercustomer,
    totalusagelimit,
    valid_from,
    valid_to,
    status,
  } = couponData;

  // -------------------------------
  // Required fields
  // -------------------------------

  if (
    !code ||
    !discounttype ||
    discountvalue === undefined ||
    minorderAmount === undefined ||
    !usespercustomer ||
    !totalusagelimit ||
    !valid_from ||
    !valid_to
  ) {
    throw new Error("All required coupon fields must be provided");
  }

  // -------------------------------
  // Format coupon code
  // -------------------------------

  code = code.trim().toUpperCase();

  // -------------------------------
  // Coupon type
  // -------------------------------

  couponType = couponType || "all";

  if (!["all", "firstOrder"].includes(couponType)) {
    throw new Error(
      "Coupon type must be all or firstOrder"
    );
  }

  // -------------------------------
  // Check duplicate coupon
  // -------------------------------

  const existingCoupon =
    await couponRepository.getCouponByCode(code);

  if (existingCoupon) {
    throw new Error("Coupon code already exists");
  }

  // -------------------------------
  // Validate discount type
  // -------------------------------

  if (!["percentage", "fixed"].includes(discounttype)) {
    throw new Error(
      "Discount type must be percentage or fixed"
    );
  }

  // -------------------------------
  // Validate discount value
  // -------------------------------

  if (Number(discountvalue) <= 0) {
    throw new Error(
      "Discount value must be greater than 0"
    );
  }

  // Percentage cannot exceed 100

  if (
    discounttype === "percentage" &&
    Number(discountvalue) > 100
  ) {
    throw new Error(
      "Percentage discount cannot exceed 100%"
    );
  }

  // -------------------------------
  // Validate minimum order
  // -------------------------------

  if (Number(minorderAmount) < 0) {
    throw new Error(
      "Minimum order amount cannot be negative"
    );
  }

  // -------------------------------
  // Validate usage
  // -------------------------------

  if (Number(usespercustomer) <= 0) {
    throw new Error(
      "Uses per customer must be greater than 0"
    );
  }

  if (Number(totalusagelimit) <= 0) {
    throw new Error(
      "Total usage limit must be greater than 0"
    );
  }

  if (
    Number(usespercustomer) >
    Number(totalusagelimit)
  ) {
    throw new Error(
      "Uses per customer cannot exceed total usage limit"
    );
  }

  // -------------------------------
  // Validate dates
  // -------------------------------

  const startDate = new Date(valid_from);
  const endDate = new Date(valid_to);

  if (
    isNaN(startDate.getTime()) ||
    isNaN(endDate.getTime())
  ) {
    throw new Error("Invalid coupon dates");
  }

  if (endDate <= startDate) {
    throw new Error(
      "Valid to date must be after valid from date"
    );
  }

  // -------------------------------
  // Percentage max discount
  // -------------------------------

  if (
    discounttype === "percentage" &&
    maxdiscountAmount !== null &&
    maxdiscountAmount !== undefined &&
    maxdiscountAmount !== "" &&
    Number(maxdiscountAmount) <= 0
  ) {
    throw new Error(
      "Maximum discount must be greater than 0"
    );
  }

  // -------------------------------
  // Create object
  // -------------------------------

  const newCoupon = {
    userId: userId || null,

    code,

    couponType,

    discounttype,

    discountvalue: Number(discountvalue),

    minorderAmount: Number(minorderAmount),

    maxdiscountAmount:
      maxdiscountAmount !== null &&
      maxdiscountAmount !== undefined &&
      maxdiscountAmount !== ""
        ? Number(maxdiscountAmount)
        : null,

    usespercustomer: Number(usespercustomer),

    totalusagelimit: Number(totalusagelimit),

    valid_from: startDate,

    valid_to: endDate,

    status: status || "active",
  };

  return await couponRepository.createCoupon(newCoupon);
};


// ==========================================
// GET ALL COUPONS
// ==========================================

const getAllCoupons = async () => {
  const coupons =
    await couponRepository.getAllCoupons();

  const now = new Date();

  return coupons.map((coupon) => {
    let displayStatus = coupon.status;

    if (coupon.status === "inactive") {
      displayStatus = "Inactive";
    } else if (now < coupon.valid_from) {
      displayStatus = "Scheduled";
    } else if (now > coupon.valid_to) {
      displayStatus = "Expired";
    } else {
      displayStatus = "Active";
    }

    return {
      ...coupon.toObject(),
      displayStatus,
    };
  });
};


// ==========================================
// GET COUPON BY ID
// ==========================================

const getCouponById = async (id) => {
  const coupon =
    await couponRepository.getCouponById(id);

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  return coupon;
};


// ==========================================
// UPDATE COUPON
// ==========================================

const updateCoupon = async (id, couponData) => {
  const existingCoupon =
    await couponRepository.getCouponById(id);

  if (!existingCoupon) {
    throw new Error("Coupon not found");
  }

  // -------------------------------
  // Code validation
  // -------------------------------

  if (couponData.code) {
    couponData.code =
      couponData.code.trim().toUpperCase();

    const duplicate =
      await couponRepository.getCouponByCode(
        couponData.code
      );

    if (
      duplicate &&
      duplicate._id.toString() !== id
    ) {
      throw new Error(
        "Coupon code already exists"
      );
    }
  }

  // -------------------------------
  // Coupon type validation
  // -------------------------------

  if (couponData.couponType !== undefined) {
    if (
      !["all", "firstOrder"].includes(
        couponData.couponType
      )
    ) {
      throw new Error(
        "Coupon type must be all or firstOrder"
      );
    }
  }

  // -------------------------------
  // Discount validation
  // -------------------------------

  if (couponData.discounttype) {
    if (
      !["percentage", "fixed"].includes(
        couponData.discounttype
      )
    ) {
      throw new Error(
        "Invalid discount type"
      );
    }
  }

  if (couponData.discountvalue !== undefined) {
    if (Number(couponData.discountvalue) <= 0) {
      throw new Error(
        "Discount value must be greater than 0"
      );
    }

    const type =
      couponData.discounttype ||
      existingCoupon.discounttype;

    if (
      type === "percentage" &&
      Number(couponData.discountvalue) > 100
    ) {
      throw new Error(
        "Percentage discount cannot exceed 100%"
      );
    }
  }

  // -------------------------------
  // Minimum order validation
  // -------------------------------

  if (couponData.minorderAmount !== undefined) {
    if (Number(couponData.minorderAmount) < 0) {
      throw new Error(
        "Minimum order amount cannot be negative"
      );
    }
  }

  // -------------------------------
  // Usage validation
  // -------------------------------

  if (couponData.usespercustomer !== undefined) {
    if (Number(couponData.usespercustomer) <= 0) {
      throw new Error(
        "Uses per customer must be greater than 0"
      );
    }
  }

  if (couponData.totalusagelimit !== undefined) {
    if (Number(couponData.totalusagelimit) <= 0) {
      throw new Error(
        "Total usage limit must be greater than 0"
      );
    }
  }

  const usesPerCustomer =
    couponData.usespercustomer !== undefined
      ? Number(couponData.usespercustomer)
      : Number(existingCoupon.usespercustomer);

  const totalUsageLimit =
    couponData.totalusagelimit !== undefined
      ? Number(couponData.totalusagelimit)
      : Number(existingCoupon.totalusagelimit);

  if (usesPerCustomer > totalUsageLimit) {
    throw new Error(
      "Uses per customer cannot exceed total usage limit"
    );
  }

  // -------------------------------
  // Date validation
  // -------------------------------

  const startDate =
    couponData.valid_from
      ? new Date(couponData.valid_from)
      : existingCoupon.valid_from;

  const endDate =
    couponData.valid_to
      ? new Date(couponData.valid_to)
      : existingCoupon.valid_to;

  if (
    isNaN(startDate.getTime()) ||
    isNaN(endDate.getTime())
  ) {
    throw new Error("Invalid coupon dates");
  }

  if (endDate <= startDate) {
    throw new Error(
      "Valid to date must be after valid from date"
    );
  }

  // -------------------------------
  // Max discount validation
  // -------------------------------

  const finalDiscountType =
    couponData.discounttype ||
    existingCoupon.discounttype;

  if (
    finalDiscountType === "percentage" &&
    couponData.maxdiscountAmount !== null &&
    couponData.maxdiscountAmount !== undefined &&
    couponData.maxdiscountAmount !== "" &&
    Number(couponData.maxdiscountAmount) <= 0
  ) {
    throw new Error(
      "Maximum discount must be greater than 0"
    );
  }

  return await couponRepository.updateCoupon(
    id,
    couponData
  );
};


// ==========================================
// DELETE COUPON
// ==========================================

const deleteCoupon = async (id) => {
  const coupon =
    await couponRepository.getCouponById(id);

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  return await couponRepository.deleteCoupon(id);
};
// ==========================================
// CHECK COUPON ELIGIBILITY
// ==========================================

const checkCouponEligibility = async (couponId, userId) => {
  const coupon =
    await couponRepository.getCouponById(couponId);

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  // ------------------------------------------
  // ALL USERS
  // ------------------------------------------

  if (coupon.couponType === "all") {
    return {
      eligible: true,
      coupon,
    };
  }

  // ------------------------------------------
  // FIRST ORDER
  // ------------------------------------------

  if (coupon.couponType === "firstOrder") {
    if (!userId) {
      return {
        eligible: false,
        message:
          "Please login to use this coupon",
      };
    }

    const hasPreviousOrder =
      await couponRepository.hasPreviousOrder(
        userId
      );

    if (hasPreviousOrder) {
      return {
        eligible: false,
        message:
          "This coupon is available only for your first order",
      };
    }

    return {
      eligible: true,
      coupon,
    };
  }

  return {
    eligible: false,
    message: "Invalid coupon type",
  };
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  checkCouponEligibility
};