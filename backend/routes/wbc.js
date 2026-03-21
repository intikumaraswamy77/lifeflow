const express = require("express");
const multer = require("multer");
const { predictWBC } = require("../models/wbc");

const router = express.Router();

// Multer configuration for image upload
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"), false);
    } else {
      cb(null, true);
    }
  },
});

// POST /api/wbc/predict - WBC image prediction
router.post("/predict", upload.single("image"), predictWBC);

module.exports = router;

