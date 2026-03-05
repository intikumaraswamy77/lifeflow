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

  const imagePath = path.resolve(req.file.path);
  const scriptPath = path.resolve(__dirname, "../ml/predict_wbc.py");

  execFile(
    PYTHON_PATH,
    [scriptPath, imagePath],
    { timeout: 30000 },
    (err, stdout, stderr) => {
      // cleanup image
      try { fs.unlinkSync(imagePath); } catch {}

      if (err) {
        console.error("❌ Python execution error:", err.message);
        if (stderr) console.error("stderr:", stderr);
        
        // Check for missing dependencies
        if (stderr.includes('No module named') || stderr.includes('ModuleNotFoundError')) {
          return res.status(503).json({
            success: false,
            error: "WBC prediction requires machine learning libraries (NumPy, TensorFlow) that are not available on the current hosting platform. Please try the basic disease prediction instead.",
            suggestion: "This feature works in local development but requires a different hosting platform with Python < 3.14."
          });
        }
        
        return res.status(500).json({
          success: false,
          error: `Python execution failed: ${err.message}`,
          details: stderr
        });
      }

      try {
        const prediction = JSON.parse(stdout.trim());
        return res.json({
          success: true,
          prediction,
        });
      } catch (parseErr) {
        console.error("❌ Invalid Python output:", stdout);
        return res.status(500).json({
          success: false,
          error: "Invalid prediction format from model",
          raw_output: stdout
        });
      }
    }
  );
};

module.exports = { predictWBC };
