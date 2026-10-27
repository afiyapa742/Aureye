const express = require("express");
const uploads =  require("../auth/uploads")
const router = express.Router();

const {
 adminLogin,
  getprofile,
  updateadminimage,
  getAlluser,
  updateUserStatus,
  userdelete
} = require("../controllers/admin");
const { adcategory ,getCategory, EditCategory, DeleteCategory,GetCategoryById,Searchcategory,getPagination,Filtercategory,findCatogory} = require("../controllers/category");

router.post(
  "/login",
  adminLogin
);


router.get(
  "/profile/:id",
  getprofile
);


router.put(
  "/profile/:id",
  updateadminimage
);
router.delete("/userlist/:id",userdelete)
router.get("/userlist" ,getAlluser)
router.put("/userlist/:id", updateUserStatus);
router.post(
  "/category",
  uploads.single("image"),
  adcategory
);

router.get("/category", getCategory);
router.get("/category/search", Searchcategory);
router.get("/category/pagination",getPagination);
router.get("/category/filter",Filtercategory);
router.get("/category/:id", GetCategoryById);
router.put(
  "/category/edit/:id",
  uploads.single("image"),
  EditCategory
);


router.delete("/category/delete/:id",DeleteCategory);
// Handle image upload validation errors
router.use((err, req, res, next) => {
  if (
    err.message ===
    "Only JPG, JPEG, PNG and WEBP images are allowed."
  ) {
    return res.status(400).json({
      message: err.message,
    });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "Image size must not exceed 2 MB.",
    });
  }

  next(err);
});

module.exports = router;