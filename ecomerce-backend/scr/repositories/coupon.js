const Coupon = require("../models/coupon");
const Order = require("../models/order");

const createCoupon = async (couponData) => {
  return await Coupon.create(couponData);
};

const getAllCoupons = async () => {
  return await Coupon.find()
    .sort({ createdAt: -1 });
};

const getCouponById = async (id) => {
  return await Coupon.findById(id);
};

const getCouponByCode = async (code) => {
  return await Coupon.findOne({
    code: code.toUpperCase(),
  });
};

const updateCoupon = async (id, couponData) => {
  return await Coupon.findByIdAndUpdate(
    id,
    couponData,
    {
      new: true,
      runValidators: true,
    }
  );
};

const deleteCoupon = async (id) => {
  return await Coupon.findByIdAndDelete(id);
};

const countCoupons = async () => {
  return await Coupon.countDocuments();
};

// ==========================================
// CHECK WHETHER USER HAS PREVIOUS ORDER
// ==========================================

const hasPreviousOrder = async (userId) => {
  const orderCount = await Order.countDocuments({
    userId,
    orderstatus: {
      $ne: "cancelled",
    },
  });

  return orderCount > 0;
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  getCouponByCode,
  updateCoupon,
  deleteCoupon,
  countCoupons,
  hasPreviousOrder,
};