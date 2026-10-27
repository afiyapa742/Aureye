const couponService = require("../services/coupon");

// ==========================================
// CREATE COUPON
// ==========================================

const createCoupon = async (req, res) => {
  try {
    const couponData = {
      ...req.body,

      userId: req.admin?._id || req.admin?.id,

      couponType: req.body.couponType || "all",
    };

    const coupon =
      await couponService.createCoupon(couponData);

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    console.error(
      "Create Coupon Error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET ALL COUPONS
// ==========================================

const getAllCoupons = async (req, res) => {
  try {
    const coupons =
      await couponService.getAllCoupons();

    return res.status(200).json({
      success: true,
      message: "Coupons fetched successfully",
      data: coupons,
    });
  } catch (error) {
    console.error(
      "Get Coupons Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET SINGLE COUPON
// ==========================================

const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon =
      await couponService.getCouponById(id);

    return res.status(200).json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error(
      "Get Coupon By ID Error:",
      error
    );

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE COUPON
// ==========================================

const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon =
      await couponService.updateCoupon(
        id,
        req.body
      );

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    console.error(
      "Update Coupon Error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// DELETE COUPON
// ==========================================

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    await couponService.deleteCoupon(id);

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Coupon Error:",
      error
    );

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================================
// CHECK COUPON ELIGIBILITY
// ==========================================

const checkCouponEligibility = async (req, res) => {
  try {
    const { id } = req.params;

    const userId =
      req.user?._id ||
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to use this coupon",
      });
    }

    const result =
      await couponService.checkCouponEligibility(
        id,
        userId
      );

    if (!result.eligible) {
      return res.status(403).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon is available",
      data: result.coupon,
    });
  } catch (error) {
    console.error(
      "Coupon Eligibility Error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  checkCouponEligibility
};