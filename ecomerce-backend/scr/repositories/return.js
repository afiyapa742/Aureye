const OrderItem = require("../models/orderitems");

// =====================================================
// GET ALL RETURN / REFUND REQUESTS
// =====================================================

const getAllReturnRequests = async () => {

  const requests = await OrderItem.find({
    status: {
      $in: [
        "return_requested",
        "return_approved",
        "returned",
      ],
    },
  })
    .populate({
      path: "orderId",
      populate: {
        path: "userId",
        select: "name email",
      },
    })
    .populate("productId")
    .populate("variantId")
    .sort({ createdAt: -1 });

  console.log(
    "RETURN ORDER ITEMS:",
    requests.map(item => ({
      itemId: item._id,
      orderId: item.orderId?._id,

      paymentmethod:
        item.orderId?.paymentmethod,

      paymentstatus:
        item.orderId?.paymentstatus,

      price: item.price,

      quantity: item.quantity,

      // IMPORTANT:
      // Actual amount customer paid
      paidAmount: item.paidAmount,

      refundAmount: item.refundAmount,

      status: item.status
    }))
  );

  return requests;
};


// =====================================================
// GET SINGLE REQUEST
// =====================================================

const getReturnRequestById = async (
  itemId
) => {

  return await OrderItem.findById(itemId)
    .populate({
      path: "orderId",
      populate: {
        path: "userId",
        select: "name email"
      }
    })
    .populate("productId")
    .populate("variantId");
};


// =====================================================
// UPDATE RETURN STATUS
// =====================================================

const updateReturnStatus = async (
  itemId,
  status
) => {

  const updateData = {
    status
  };

  if (
    status === "return_approved"
  ) {

    updateData.returnApprovedAt =
      new Date();

    updateData.refundStatus =
      "PENDING";
  }

  return await OrderItem.findByIdAndUpdate(
    itemId,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );
};


// =====================================================
// MARK PRODUCT AS RECEIVED
// =====================================================

const markReturnReceived = async (
  itemId
) => {

  return await OrderItem.findByIdAndUpdate(
    itemId,
    {
      status: "returned",
      returnReceivedAt: new Date(),
      refundStatus: "PENDING"
    },
    {
      new: true,
      runValidators: true
    }
  );
};


// =====================================================
// MARK REFUND COMPLETED
// =====================================================

const markRefundCompleted = async (
  itemId,
  refundAmount
) => {

  return await OrderItem.findByIdAndUpdate(
    itemId,
    {
      refundStatus: "REFUNDED",
      refundAmount,
      refundedAt: new Date()
    },
    {
      new: true,
      runValidators: true
    }
  );
};


module.exports = {
  getAllReturnRequests,
  getReturnRequestById,
  updateReturnStatus,
  markReturnReceived,
  markRefundCompleted
};