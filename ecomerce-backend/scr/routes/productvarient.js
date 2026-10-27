const express = require("express");
const router = express.Router();

const {
  getVarient,
  addVarient,
  editVarient,
  deleteVarient
} = require("../controllers/productvarient");

const upload = require("../auth/uploads");

router.get("/", getVarient);

router.post(
  "/add",
  upload.array("images", 10),
  addVarient
);

router.put(
  "/edit/:id",
  upload.array("images", 10),
  editVarient
);

router.delete(
  "/delete/:id",
  deleteVarient
);

module.exports = router;