const {

  getAllReturnRequests,

  getReturnRequestById,

  updateReturnStatus,

  markReturnReceived,

  markRefundCompleted

} = require("../repositories/return");

const { getOrderItems } = require("../repositories/checkout");

const { creditWallet } = require("../repositories/wallet");


// =====================================================

// GET ALL

// =====================================================



const getAllReturns = async () => {

  return await getAllReturnRequests();

};





// =====================================================

// GET ONE

// =====================================================



const getReturnById = async (itemId) => {



  const returnRequest =

    await getReturnRequestById(itemId);



  if (!returnRequest) {

    throw new Error("Return request not found");

  }



  return returnRequest;

};





// =====================================================

// ACCEPT RETURN

// =====================================================



const changeReturnStatus = async (

  itemId,

  status

) => {



  // Admin page should only send this

  // for delivered return requests



  if (status !== "return_approved") {

    throw new Error("Invalid return action");

  }



  const returnRequest =

    await getReturnRequestById(itemId);



  if (!returnRequest) {

    throw new Error("Return request not found");

  }



  const order =

    returnRequest.orderId;



  if (!order) {

    throw new Error("Order not found");

  }



  const orderStatus =

    String(

      order.orderstatus || ""

    ).toLowerCase();



  // Accept only delivered return



  if (

    returnRequest.status !==

    "return_requested"

  ) {

    throw new Error(

      "This return request is not pending"

    );

  }



  if (orderStatus !== "delivered") {

    throw new Error(

      "Only delivered product returns can be accepted"

    );

  }



  const updatedReturn =

    await updateReturnStatus(

      itemId,

      "return_approved"

    );



  return updatedReturn;

};





// =====================================================

// MARK PRODUCT RECEIVED

// =====================================================



const receiveReturnedProduct = async (

  itemId

) => {



  const returnRequest =

    await getReturnRequestById(itemId);



  if (!returnRequest) {

    throw new Error("Return request not found");

  }



  if (

    returnRequest.status !==

    "return_approved"

  ) {

    throw new Error(

      "Return must be accepted first"

    );

  }



  const updatedReturn =

    await markReturnReceived(itemId);



  return updatedReturn;

};





// =====================================================

// REFUND TO WALLET

// =====================================================


const processReturnRefund = async (itemId) => {
  const returnRequest = await getReturnRequestById(itemId);

  if (!returnRequest) {
    throw new Error("Return request not found");
  }

  const order = returnRequest.orderId;

  if (!order) {
    throw new Error("Order not found");
  }

  // Prevent duplicate refunds
  if (returnRequest.refundStatus === "REFUNDED") {
    throw new Error("Refund has already been completed");
  }

  // Validate order status
  const orderStatus = String(order.orderstatus || "").toLowerCase();

  if (orderStatus !== "delivered") {
    throw new Error("Only delivered orders can be refunded");
  }

  if (returnRequest.status !== "returned") {
    throw new Error("Product must be received before refund");
  }

  if (!returnRequest.returnReceivedAt) {
    throw new Error("Returned product date is missing");
  }

  // Get customer
  const userId = order.userId?._id || order.userId;

  if (!userId) {
    throw new Error("Customer not found");
  }

  // Get all items in the order
  const orderItems = await getOrderItems(order._id);

  if (!orderItems || orderItems.length === 0) {
    throw new Error("Order items not found");
  }

  // Calculate product subtotal
  const itemsSubtotal = orderItems.reduce((sum, item) => {
    return sum + Number(item.price) * Number(item.quantity);
  }, 0);

  // Value of the returned item
  const returnedItemValue =
    Number(returnRequest.price) * Number(returnRequest.quantity);

  // Total actually charged for the order, including shipping and tax
  const orderTotal = Number(order.total);

  if (
    !Number.isFinite(itemsSubtotal) ||
    !Number.isFinite(returnedItemValue) ||
    !Number.isFinite(orderTotal) ||
    itemsSubtotal <= 0 ||
    returnedItemValue <= 0 ||
    orderTotal <= 0
  ) {
    throw new Error("Invalid refund calculation");
  }

  // Allocate the full order total proportionally to the returned item
  const refundAmount = Math.round(
    ((orderTotal * returnedItemValue) / itemsSubtotal) * 100
  ) / 100;

  if (refundAmount <= 0 || refundAmount > orderTotal) {
    throw new Error("Calculated refund amount is invalid");
  }

  // Credit wallet
 await creditWallet(userId, {
  amount: refundAmount,
  type: "credit",
  description: "Full refund for returned product, including shipping and tax",
  orderId: order._id,
  transactionId: `REFUND-${returnRequest._id}`,
});

  // Mark refund completed
  const updatedReturn = await markRefundCompleted(
    itemId,
    refundAmount
  );

  return {
    type: "PRODUCT_RETURN",
    refundAmount,
    message: "Full refund added to wallet successfully",
    data: updatedReturn,
  };
};








// =====================================================

// EXPORT

// =====================================================



module.exports = {

  getAllReturns,

  getReturnById,

  changeReturnStatus,

  receiveReturnedProduct,

  processReturnRefund

};