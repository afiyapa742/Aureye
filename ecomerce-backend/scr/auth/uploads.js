
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// 1. Upload folder
const uploadPath = path.join(__dirname, "../../uploads");

// Folder ഇല്ലെങ്കിൽ create ചെയ്യും
fs.mkdirSync(uploadPath, { recursive: true });

// 2. Allowed image types
const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// 3. Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName = crypto.randomUUID() + extension;

    cb(null, uniqueName);
  },
});

// 4. File validation
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  // File type check
  if (
    !allowedTypes.includes(file.mimetype) ||
    !allowedExtensions.includes(extension)
  ) {
    return cb(
      new Error("Only JPG, JPEG, PNG and WEBP images are allowed.")
    );
  }

  cb(null, true);
};

// 5. Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

// 6. Export
module.exports = upload;
