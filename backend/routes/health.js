const express = require('express');
const { execFile } = require('child_process');
const path = require('path');

const router = express.Router();

// System health check
router.get('/system', async (req, res) => {
  try {
    const { exec } = require('child_process');
    
    // Get memory usage
    exec('free -m', (error, stdout) => {
      let memoryInfo = {};
      if (!error) {
        const lines = stdout.split('\n');
        const memLine = lines.find(line => line.includes('Mem:'));
        if (memLine) {
          const parts = memLine.split(/\s+/);
          memoryInfo = {
            total: parts[1] + 'MB',
            used: parts[2] + 'MB',
            free: parts[3] + 'MB'
          };
        }
      }
      
      // Get Python process memory
      exec('tasklist /FI "IMAGENAME eq python.exe" /FO CSV', (pyError, pyStdout) => {
        let pythonMemory = [];
        if (!pyError && pyStdout) {
          const lines = pyStdout.split('\n');
          lines.forEach(line => {
            if (line.includes('python.exe')) {
              const parts = line.split(',');
              pythonMemory.push({
                pid: parts[1],
                memory: parts[4] || 'N/A',
                name: parts[0]
              });
            }
          });
        }
        
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          memory: memoryInfo,
          python_processes: pythonMemory,
          uptime: process.uptime(),
          node_memory: process.memoryUsage(),
          recommendations: {
            restart_python: pythonMemory.length > 3,
            memory_warning: pythonMemory.some(p => parseInt(p.memory) > 500000), // >500MB
            check_logs: pythonMemory.length > 5
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test WBC prediction system
router.get('/wbc', async (req, res) => {
  try {
    const fs = require('fs');
    const testImagePath = path.join(__dirname, '../uploads/test.jpg');
    
    // Create a simple test image if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      // Create a 1x1 pixel test image
      const testImageData = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      fs.writeFileSync(testImagePath, testImageData);
    }
    
    const PYTHON_PATH = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = path.resolve(__dirname, '../ml/predict_wbc.py');
    
    execFile(
      PYTHON_PATH,
      [scriptPath, testImagePath],
      { timeout: 10000 },
      (err, stdout, stderr) => {
        // Clean up test image
        try { fs.unlinkSync(testImagePath); } catch {}
        
        if (err) {
          return res.json({
            status: 'error',
            error: err.message,
            stderr: stderr,
            timestamp: new Date().toISOString()
          });
        }
        
        try {
          const prediction = JSON.parse(stdout.trim());
          res.json({
            status: 'working',
            prediction,
            timestamp: new Date().toISOString()
          });
        } catch (parseErr) {
          res.json({
            status: 'error',
            error: 'Invalid JSON output',
            raw_output: stdout,
            timestamp: new Date().toISOString()
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
