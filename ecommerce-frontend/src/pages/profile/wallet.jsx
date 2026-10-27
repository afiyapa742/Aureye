
import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import { FaWallet, FaPlus } from "react-icons/fa";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import "./Wallet.css";

const QUICK_AMOUNTS = [500, 1000, 2500, 5000, 10000, 15000];

const Wallet = () => {
  const [wallet, setWallet] = useState({
    balance: 0,
    transactions: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // ADD MONEY MODAL
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const itemsPerPage = 5;

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  // GET WALLET DETAILS
  const fetchWallet = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/wallet");

      const walletData = response.data?.data;

      setWallet({
        balance: Number(walletData?.balance || 0),
        transactions: Array.isArray(walletData?.transactions)
          ? walletData.transactions
          : [],
      });

    } catch (error) {
      console.error("WALLET ERROR:", error);

      setError(
        error.response?.data?.message ||
        "Unable to fetch wallet details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  // TRANSACTIONS
  const transactions = wallet.transactions || [];

  // SORT TRANSACTIONS
  const sortedTransactions = [...transactions].sort(
    (a, b) =>
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  // PAGINATION
  const totalPages = Math.ceil(
    sortedTransactions.length / itemsPerPage
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentTransactions = sortedTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // FORMAT DATE
  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-GB");
  };

  // OPEN MODAL
  const handleAddMoney = () => {
    setAmount("");
    setPaymentError("");
    setShowAddMoney(true);
  };

  // SELECT QUICK AMOUNT
  const handleQuickAmount = (value) => {
    setAmount(String(value));
    setPaymentError("");
  };

  // VALIDATE AMOUNT
  const numericAmount = Number(amount);

  const isValidAmount =
    amount.trim() !== "" &&
    Number.isFinite(numericAmount) &&
    numericAmount >= 1 &&
    numericAmount <= 100000;

  // CREATE PAYPAL ORDER
  const createPayPalOrder = async () => {
    try {
      setPaymentError("");
      setPaymentLoading(true);

      if (!isValidAmount) {
        throw new Error("Enter an amount between ₹1 and ₹100000");
      }

      const response = await API.post(
        "/wallet/paypal/create-order",
        {
          amount: numericAmount,
        }
      );

      const paypalOrderId = response.data?.data?.paypalOrderId;

      if (!paypalOrderId) {
        throw new Error("PayPal order ID not received");
      }

      return paypalOrderId;

    } catch (error) {
      console.error("CREATE PAYPAL ORDER ERROR:", error);

      setPaymentError(
        error.response?.data?.message ||
        error.message ||
        "Unable to create PayPal order"
      );

      throw error;

    } finally {
      setPaymentLoading(false);
    }
  };

  // CAPTURE PAYPAL PAYMENT
  const capturePayPalPayment = async (data) => {
    try {
      setPaymentLoading(true);
      setPaymentError("");

      const response = await API.post(
        "/wallet/paypal/capture-order",
        {
          paypalOrderId: data.orderID,
        }
      );

      if (!response.data?.success) {
        throw new Error("Wallet payment could not be confirmed");
      }

      alert("Money added to your wallet successfully!");

      setShowAddMoney(false);
      setAmount("");
      setCurrentPage(1);

      await fetchWallet();

    } catch (error) {
      console.error("CAPTURE PAYPAL ERROR:", error);

      setPaymentError(
        error.response?.data?.message ||
        error.message ||
        "Payment verification failed. Please contact support if you were charged."
      );

    } finally {
      setPaymentLoading(false);
    }
  };

  // LOADING
  if (loading) {
    return (
      <div className="wallet-page">
        <p>Loading wallet...</p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        "client-id": paypalClientId || "YOUR_SANDBOX_CLIENT_ID",
        currency: "USD",
        intent: "capture",
      }}
    >
      <div className="wallet-page">

        {/* BREADCRUMB */}
        <div className="wallet-breadcrumb">
          Profile &gt; Wallet
        </div>

        <div className="wallet-container">

          <h2>My Wallet</h2>

          {/* ERROR */}
          {error && (
            <p className="wallet-error">
              {error}
            </p>
          )}

          {/* BALANCE CARD */}
          <div className="wallet-balance-card">

            <div className="wallet-balance-icon">
              <FaWallet />
            </div>

            <div>
              <h3>Available wallet balance:</h3>

              <h2>
                ₹{wallet.balance.toFixed(2)}
              </h2>
            </div>

          </div>

          {/* TRANSACTION HISTORY */}
          <div className="wallet-table-wrapper">

            <table className="wallet-table">

              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Transaction Date</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Debit / Credit</th>
                </tr>
              </thead>

              <tbody>

                {currentTransactions.length > 0 ? (

                  currentTransactions.map((transaction) => (

                    <tr key={transaction._id}>

                      <td>
                        #{transaction.transactionId || transaction._id}
                      </td>

                      <td>
                        {formatDate(transaction.createdAt)}
                      </td>

                      <td>
                        ₹{Number(transaction.amount || 0).toFixed(2)}
                      </td>

                      <td>
                        {transaction.description || "-"}
                      </td>

                      <td>
                        <span
                          className={
                            transaction.type === "credit"
                              ? "wallet-credit"
                              : "wallet-debit"
                          }
                        >
                          Amount{" "}
                          {transaction.type === "credit"
                            ? "Credited"
                            : "Debited"}
                        </span>
                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>
                    <td colSpan="5" className="wallet-empty">
                      No transactions found
                    </td>
                  </tr>

                )}

              </tbody>

            </table>

          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (

            <div className="wallet-pagination">

              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((prev) => prev - 1)
                }
              >
                ‹
              </button>

              <span>
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => prev + 1)
                }
              >
                ›
              </button>

            </div>

          )}

          {/* ADD MONEY BUTTON */}
          <div className="wallet-add-button-wrapper">

            <button
              className="wallet-add-button"
              onClick={handleAddMoney}
            >
              <FaPlus /> ADD MONEY
            </button>

          </div>

        </div>

        {/* ADD MONEY MODAL */}
        {showAddMoney && (

          <div
            className="wallet-modal-overlay"
            onClick={() => {
              if (!paymentLoading) {
                setShowAddMoney(false);
              }
            }}
          >

            <div
              className="wallet-add-modal"
              onClick={(e) => e.stopPropagation()}
            >

              <button
                className="wallet-modal-close"
                onClick={() => setShowAddMoney(false)}
                disabled={paymentLoading}
              >
                &times;
              </button>

              <h3>Add Money to Wallet</h3>

              <label htmlFor="walletAmount">
                Enter Amount
              </label>

              <input
                id="walletAmount"
                type="number"
                min="1"
                max="100000"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setPaymentError("");
                }}
              />

              <div className="wallet-modal-or">
                Or
              </div>

              {/* QUICK AMOUNTS */}
              <div className="wallet-quick-amounts">

                {QUICK_AMOUNTS.map((value) => (

                  <button
                    key={value}
                    type="button"
                    className={
                      Number(amount) === value
                        ? "wallet-quick-active"
                        : ""
                    }
                    onClick={() => handleQuickAmount(value)}
                  >
                    ₹{value}
                  </button>

                ))}

              </div>

              <div className="wallet-payment-method">

                <strong>Payment Method</strong>

                {isValidAmount ? (

                  <div className="wallet-paypal-button">

                    {!paypalClientId ? (

                      <p className="wallet-error">
                        PayPal Client ID missing in frontend .env
                      </p>

                    ) : (

                      <PayPalButtons
                        style={{
                          layout: "horizontal",
                          label: "paypal",
                          shape: "rect",
                          height: 40,
                        }}
                        disabled={paymentLoading}
                        createOrder={createPayPalOrder}
                        onApprove={capturePayPalPayment}
                        onCancel={() => {
                          setPaymentError("Payment cancelled");
                        }}
                        onError={(error) => {
                          console.error("PAYPAL ERROR:", error);
                          setPaymentError(
                            "PayPal payment failed. Please try again."
                          );
                        }}
                      />

                    )}

                  </div>

                ) : (

                  <button
                    type="button"
                    className="wallet-paypal-disabled"
                    disabled
                  >
                    PayPal
                  </button>

                )}

              </div>

              {paymentLoading && (
                <p className="wallet-payment-loading">
                  Processing payment...
                </p>
              )}

              {paymentError && (
                <p className="wallet-error">
                  {paymentError}
                </p>
              )}

              <p className="wallet-payment-note">
                Your wallet will be credited after successful payment verification.
              </p>

            </div>

          </div>

        )}

      </div>
    </PayPalScriptProvider>
  );
};

export default Wallet;