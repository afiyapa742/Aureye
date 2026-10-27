const express = require("express");
const router = express.Router();

const {
  AddMeterial,
  GetMeterial,
  UpdateMeterial,
  UpdateStatus,
  DeleteMeterial
} = require("../controllers/meterial");

router.get("/", GetMeterial);
router.post("/addmeterial", AddMeterial);

router.put("/update/:id", UpdateMeterial);

router.put("/status/:id", UpdateStatus);

router.delete("/delete/:id", DeleteMeterial);

module.exports = router