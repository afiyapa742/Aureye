const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

dotenv.config();

const app = express();
const errorMiddleware = require("./scr/auth/errormiddleware");

const isProduction = process.env.NODE_ENV === "production";


app.set("trust proxy", 1);

// ===============================
// CORS
// ===============================
const allowedOrigins = [
  process.env.CLIENT_URL,"https://www.aureyaforwomen.shop",
  process.env.ADMIN_URL,
  ...(isProduction ? [] : ["http://localhost:5175"]),
].filter(Boolean);

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
// BODY PARSERS + UPLOADS
// ===============================
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

app.use(express.json({ limit: "10mb" }));
app.use(
  express.urlencoded({
    limit: "10mb",
    extended: true,
  })
);

// ===============================
// TEST + HEALTH
// ===============================
app.get("/", (req, res) => {
  res.json({
    message: "E-commerce backend is working",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
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
const meterialRoutes = require("./scr/routes/meterial");
app.use("/api/meterial", meterialRoutes);
const productRoutes = require("./scr/routes/product");
app.use("/api/product", productRoutes);
const productvarientRoute = require("./scr/routes/productvarient");
app.use("/api/productvarient", productvarientRoute);
const cartRoutes = require("./scr/routes/cart");
app.use("/api/cart", cartRoutes);
const wishrouter = require("./scr/routes/wishlist");
app.use("/api/wishlist", wishrouter);

const checkout = require("./scr/routes/checkout");
app.use("/api/checkout", checkout);

const orderdetails = require("./scr/routes/orderdetail");
app.use("/api/myorder", orderdetails);
const adminOrderRoutes = require("./scr/routes/adminorder");
app.use("/api/admin", adminOrderRoutes);
const inventory = require("./scr/routes/admininventory");
app.use("/api/admin", inventory);
const trackOrder = require("./scr/routes/trackorder");
app.use("/api/myorder", trackOrder);
const payment = require("./scr/routes/payment");
app.use("/api/payment", payment);
const wallet = require("./scr/routes/walletrotes");
app.use("/api/wallet", wallet);
const returnRoutes = require("./scr/routes/return");
app.use("/api/admin", returnRoutes);
const coupon = require("./scr/routes/coupon");
app.use("/api/admin", coupon);

const offerRoutes = require("./scr/routes/offer");
app.use("/api/admin", offerRoutes);
app.use("/api", offerRoutes);

const salesReportRoutes = require("./scr/routes/salesreport");
app.use("/api/admin", salesReportRoutes);
const cancelRefundRoutes = require("./scr/routes/cancelrefund");
app.use("/api/cancel-refund", cancelRefundRoutes);
const referral = require("./scr/routes/referal.js");
app.use("/api/referral", referral);
const userOfferRoutes = require("./scr/routes/userOfferRoutes.js");
app.use("/api/offers", userOfferRoutes);


app.use(errorMiddleware);

// ===============================
// DATABASE + SERVER
// ===============================
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST; 

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    await createAdmin();

    const onListen = () => {
      console.log(`Server running on port ${PORT}`);
    };

    if (HOST) {
      app.listen(PORT, HOST, onListen);
    } else {
      app.listen(PORT, onListen);
    }
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });