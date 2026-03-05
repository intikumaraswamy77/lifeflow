const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const PYTHON_PATH = process.platform === 'win32' ? 'python' : 'python3'; 
// 🔴 If this fails, replace with full path like:
// "C:\\Users\\YourName\\AppData\\Local\\Programs\\Python\\Python39\\python.exe"

const predictWBC = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "Image file is required",
    });
  }

  // Cleanup uploaded file immediately since TensorFlow is not available
  try { fs.unlinkSync(req.file.path); } catch {}

  return res.status(503).json({
    success: false,
    error: "WBC prediction is temporarily unavailable due to TensorFlow compatibility issues. Please try the basic disease prediction instead.",
    alternative: "Use the Disease Prediction feature which is working correctly"
  });
};

module.exports = { predictWBC };
