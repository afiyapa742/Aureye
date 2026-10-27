const mongoose = require("mongoose");

const meterialschema = new mongoose.Schema(
  {
    MeterialName: {
      type: String,
      required: true
    },

    Description: {
      type: String,
      required: true
    },

    Status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Meterial = mongoose.model("Meterial", meterialschema);

module.exports = Meterial;