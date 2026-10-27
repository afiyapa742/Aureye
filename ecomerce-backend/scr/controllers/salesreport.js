
const salesReportService = require("../services/salesreport");

// ==========================================
// GET SALES REPORT
// ==========================================

const getSalesReport = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;

    const report = await salesReportService.getSalesReport({
      period: period || "daily",
      startDate,
      endDate,
    });

    return res.status(200).json({
      success: true,
      message: "Sales report fetched successfully",
      data: report,
    });
  } catch (error) {
    console.error("GET SALES REPORT ERROR:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Failed to fetch sales report",
    });
  }
};

module.exports = {
  getSalesReport,
};
