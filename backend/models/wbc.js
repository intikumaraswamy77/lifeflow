const { execFile } = require("child_process");

const path = require("path");

const fs = require("fs");



const PYTHON_PATH = process.platform === 'win32' ? 'python' : 'python3'; 

// 🔴 If this fails, replace with full path like:
// "C:\\Users\\YourName\\AppData\\Local\\Programs\\Python\\Python39\\python.exe"

// Track prediction attempts and errors
let predictionCount = 0;
let lastErrorTime = 0;

const predictWBC = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "Image file is required",
    });
  }

  const imagePath = path.resolve(req.file.path);
  const scriptPath = path.resolve(__dirname, "../ml/predict_wbc.py");

  // Check if we need to restart Python process (every 50 predictions or on error)
  const now = Date.now();
  const shouldRestart = predictionCount > 50 || (lastErrorTime && (now - lastErrorTime) < 120000);

  predictionCount++;
  
  // Use environment variable to pass the path
  const env = { ...process.env, IMAGE_PATH: imagePath };
  
  execFile(
    PYTHON_PATH,
    [scriptPath],
    { 
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10,
      killSignal: shouldRestart ? 'SIGKILL' : undefined,
      shell: true,
      env: env
    },
    (err, stdout, stderr) => {
      // cleanup image
      try { fs.unlinkSync(imagePath); } catch {}

      if (err) {
        lastErrorTime = Date.now();
        console.error("❌ Python execution error:", err.message);
        console.error("Full error details:", err);
        console.error("Image path:", imagePath);
        
        // Filter out TensorFlow logs from stderr
        const filteredStderr = stderr.split('\n')
          .filter(line => !line.includes('tensorflow') && !line.includes('SSE') && !line.includes('AVX'))
          .join('\n');
        
        // Reset prediction count on error
        if (err.code === 'ENOMEM' || err.message.includes('memory')) {
          predictionCount = 0;
        }
        
        return res.status(500).json({
          success: false,
          error: `Python execution failed: ${err.message}`,
          details: filteredStderr || "No error details available",
          fallback: true,
          prediction: {
            class: "Neutrophil",
            confidence: 75.0
          }
        });
      }

      try {
        // Filter out TensorFlow logs from stdout and extract JSON
        const lines = stdout.split('\n');
        let jsonOutput = null;
        
        for (const line of lines) {
          if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
            try {
              jsonOutput = JSON.parse(line.trim());
              break;
            } catch (e) {
              continue;
            }
          }
        }
        
        if (!jsonOutput) {
          throw new Error("No valid JSON output found");
        }
        
        return res.json({
          success: true,
          prediction: jsonOutput,
        });
      } catch (parseErr) {
        console.error("❌ Invalid Python output:", stdout);
        return res.status(500).json({
          success: false,
          error: "Invalid prediction format from model",
          raw_output: stdout,
          fallback: true,
          prediction: {
            class: "Neutrophil",
            confidence: 75.0
          }
        });
      }
    }
  );
};

// Reset prediction count periodically
setInterval(() => {
  predictionCount = 0;
}, 3600000); // Reset every hour

module.exports = { predictWBC };
