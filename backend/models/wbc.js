const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const PYTHON_PATH = "python"; 
// 🔴 If this fails, replace with full path like:
// "C:\\Users\\YourName\\AppData\\Local\\Programs\\Python\\Python39\\python.exe"

const predictWBC = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "Image file is required",
    });
  }

  const imagePath = path.resolve(req.file.path);
  const scriptPath = path.resolve(__dirname, "../ml/predict_wbc.py");

  execFile(
    PYTHON_PATH,
    [scriptPath, imagePath],
    { timeout: 20000 },
    (err, stdout, stderr) => {
      // cleanup image
      try { fs.unlinkSync(imagePath); } catch {}

      if (err) {
        console.error("❌ Python execution error:", err.message);
        console.error("stderr:", stderr);
        return res.status(500).json({
          success: false,
          error: "Python execution failed",
        });
      }

      try {
        const prediction = JSON.parse(stdout);
        return res.json({
          success: true,
          prediction,
        });
      } catch {
        console.error("❌ Invalid Python output:", stdout);
        return res.status(500).json({
          success: false,
          error: "Invalid prediction format from model",
        });
      }
    }
  );
};

module.exports = { predictWBC };
