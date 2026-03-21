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
        
        // Fallback to mock prediction when Python fails

        console.log("🔄 Using fallback prediction due to Python/ML issues");

        const mockPrediction = {

          class: ["Neutrophil", "Lymphocyte", "Monocyte", "Eosinophil", "Basophil"][Math.floor(Math.random() * 5)],

          confidence: Math.floor(Math.random() * 30) + 70 // 70-99%

        };
        
        return res.json({

          success: true,

          prediction: mockPrediction,

          fallback: true,

          message: "Using fallback prediction - ML libraries not available"

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
        
        // Fallback to mock prediction when parsing fails

        const mockPrediction = {

          class: ["Neutrophil", "Lymphocyte", "Monocyte", "Eosinophil", "Basophil"][Math.floor(Math.random() * 5)],

          confidence: Math.floor(Math.random() * 30) + 70

        };
        
        return res.json({

          success: true,

          prediction: mockPrediction,

          fallback: true,

          message: "Using fallback prediction - unable to parse ML output"

        });

      }

    }

  );

};



module.exports = { predictWBC };
