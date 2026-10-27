
const express = require("express");
const router = express.Router();

const {
  getSalesReport,
} = require("../controllers/salesreport");

// GET /api/admin/sales-report
router.get("/sales-report", getSalesReport);

module.exports = router;
