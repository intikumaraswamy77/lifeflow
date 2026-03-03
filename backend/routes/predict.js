const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const { body, validationResult } = require("express-validator");

const router = express.Router();
const PYTHON_CMD = process.platform === "win32" ? "python" : "python3";
const PY_FILE = path.join(__dirname, "..", "ml", "p1.py");

function runPy(args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_CMD, [PY_FILE, ...args], { cwd: path.join(__dirname, "..") });

    let out = "";
    let err = "";

    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));

    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(err || `python exited ${code}`));
      try {
        const parsed = JSON.parse(out.trim());
        resolve(parsed);
      } catch (e) {
        reject(new Error(`invalid JSON from python: ${out}\n${err}`));
      }
    });
  });
}

router.post(
  "/",
  [
    body("gender").isIn(["child", "female", "male"]),
    body("age").isFloat({ min: 0, max: 120 }),
    body("haemoglobin").isFloat({ min: 0 }),
    body("platelets").isFloat({ min: 0 }),
    body("wbc").isFloat({ min: 0 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { gender, age, haemoglobin, platelets, wbc } = req.body;

    try {
      const result = await runPy(["predict", gender, String(age), String(haemoglobin), String(platelets), String(wbc)]);
      if (!result.success) return res.status(500).json(result);

      const prediction = result.prediction;
      const confidence = result.confidence != null ? Math.round(result.confidence * 100) : null;

      let interpretation = "The analysis shows unusual patterns. Please consult a healthcare professional.";
      let recommendations = [
        "Consult a healthcare professional",
        "Bring these results to your doctor",
        "Follow up with additional tests"
      ];

      const label = String(prediction).toLowerCase();
      if (label === "normal") {
        interpretation = "Your results appear within normal ranges.";
        recommendations = [
          "Maintain a balanced diet",
          "Stay hydrated and active",
          "Continue routine check-ups"
        ];
      } else if (label === "anemia") {
        interpretation = "Possible anemia indicated. Please consult a doctor.";
        recommendations = [
          "Consult a physician",
          "Include iron-rich foods",
          "Use supplements only under medical advice"
        ];
      } else if (label === "thalassemia") {
        interpretation = "Possible thalassemia indicated. Seek medical consultation.";
        recommendations = [
          "Consult a hematologist",
          "Consider genetic counseling if relevant",
          "Regular monitoring is important"
        ];
      }

      res.json({
        success: true,
        prediction: {
          result: prediction,
          confidence,
          interpretation,
          recommendations
        }
      });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  }
);

router.post("/retrain", async (_req, res) => {
  try {
    const result = await runPy(["train"]);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
