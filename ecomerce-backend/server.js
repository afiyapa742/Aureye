const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const errorMiddleware = require("./scr/auth/errormiddleware")
// ===============================
// MIDDLEWARE
// ===============================
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  "http://localhost:5175",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
// ===============================
// MIDDLEWARE
// ===============================


app.use(errorMiddleware);
app.use("/uploads", express.static("uploads"));

app.use(express.json({ limit: "10mb" }));
app.use(
  express.urlencoded({
    limit: "10mb",
    extended: true,
  })
);
// ===============================
// TEST
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "E-commerce backend is working",
  });
});

// ===============================
// ROUTES
// ===============================
const userRoutes = require("./scr/routes/user");
const profileRoutes = require("./scr/routes/profile.routes");
const createAdmin = require("./seeAdmin");
app.use("/api/auth", userRoutes);
app.use("/api/profile", profileRoutes);
const adminRoutes = require("./scr/routes/admin");
app.use("/api/admin", adminRoutes);
const meterialRoutes = require("./scr/routes/meterial")
app.use("/api/meterial",meterialRoutes)
const productRoutes = require("./scr/routes/product");
app.use("/api/product",productRoutes)
const productvarientRoute = require("./scr/routes/productvarient");
app.use("/api/productvarient",productvarientRoute)
const cartRoutes = require("./scr/routes/cart");
app.use("/api/cart", cartRoutes);
const wishrouter = require("./scr/routes/wishlist");
app.use("/api/wishlist", wishrouter);

const checkout = require("./scr/routes/checkout");
app.use("/api/checkout",checkout)

const orderdetails = require("./scr/routes/orderdetail")
app.use("/api/myorder",orderdetails)
const adminOrderRoutes = require("./scr/routes/adminorder");
app.use(
  "/api/admin",
  adminOrderRoutes
);
const inventory = require("./scr/routes/admininventory")
app.use("/api/admin",inventory)
const trackOrder = require("./scr/routes/trackorder")
app.use("/api/myorder",trackOrder)
const payment = require("./scr/routes/payment")
app.use("/api/payment",payment)
const wallet = require("./scr/routes/walletrotes");
app.use("/api/wallet",wallet)
const returnRoutes = require("./scr/routes/return");
app.use("/api/admin",returnRoutes)
const coupon = require("./scr/routes/coupon")
app.use("/api/admin",coupon)



const offerRoutes = require("./scr/routes/offer");

app.use("/api/admin", offerRoutes);
app.use("/api", offerRoutes);

const salesReportRoutes = require("./scr/routes/salesreport");
app.use("/api/admin", salesReportRoutes);
const cancelRefundRoutes = require("./scr/routes/cancelrefund")
app.use("/api/cancel-refund", cancelRefundRoutes);
const referral = require("./scr/routes/referal.js");
app.use("/api/referral", referral);
const userOfferRoutes= require("./scr/routes/userOfferRoutes.js")
app.use("/api/offers",userOfferRoutes);
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    await createAdmin();
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
// ===============================
// SERVER
// ===============================

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});