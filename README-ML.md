# Python ML Setup for Blood Donation Platform

## Requirements Files

### 1. `requirements.txt` (Full Version)
Complete set of Python dependencies with compatible version ranges for development and production.

### 2. `requirements-minimal.txt` (Essential Only)
Minimum required packages for WBC prediction functionality:
- numpy (array operations)
- tensorflow (ML model loading/prediction)
- Pillow (image processing)
- joblib (model serialization)

## Installation

### For Development:
```bash
pip install -r requirements.txt
```

### For Production/Deployment:
```bash
pip install -r requirements-minimal.txt
```

### For Specific Python Versions:
- **Python 3.8-3.10**: Use requirements.txt
- **Python 3.11+**: Use requirements-minimal.txt (better compatibility)

## ML Model Dependencies

The WBC prediction system requires:
- **TensorFlow 2.x**: For loading and running the Keras model
- **NumPy**: For image array processing
- **Pillow (PIL)**: For image file handling
- **Joblib**: For model serialization utilities

## Version Compatibility

- **TensorFlow**: 2.8.0 - 2.15.0 (compatible with most Python versions)
- **NumPy**: 1.21.0 - 2.0.0 (stable range)
- **Pillow**: 8.0.0 - 11.0.0 (wide compatibility)

## Deployment Notes

1. **Render/Heroku**: Use `requirements-minimal.txt` for faster builds
2. **Local Development**: Use `requirements.txt` for full features
3. **Docker**: Copy appropriate requirements file based on Python version

## Troubleshooting

If TensorFlow fails to install:
```bash
# Try specific CPU version
pip install tensorflow-cpu>=2.8.0,<2.15.0
```

For memory constraints:
```bash
# Install minimal version only
pip install -r requirements-minimal.txt
```
