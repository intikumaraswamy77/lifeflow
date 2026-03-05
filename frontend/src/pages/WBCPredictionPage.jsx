import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, Upload, Image as ImageIcon } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function WBCPredictionPage() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const handlePredict = async () => {
    if (!image) {
      setError("Please upload a blood cell image.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch(`${API_BASE}/wbc/predict`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Prediction failed");
      }

      setResult(data.prediction);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError("");
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <Card className="shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
          <CardTitle className="text-3xl text-center">
            White Blood Cell Image Prediction
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <p className="text-sm text-gray-700">
            Upload a microscopic blood cell image to classify the WBC type.
          </p>

          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              id="wbc-upload"
              hidden
              onChange={handleImageChange}
            />
            <label htmlFor="wbc-upload" className="cursor-pointer">
              <Upload className="mx-auto text-indigo-500" />
              <p className="text-indigo-600 mt-2">
                Click to upload image
              </p>
            </label>
          </div>

          {preview && (
            <img
              src={preview}
              className="h-48 mx-auto rounded border"
              alt="Preview"
            />
          )}

          <div className="flex gap-4">
            <Button onClick={handlePredict} disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 animate-spin" />}
              Predict
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Reset
            </Button>
          </div>

          {error && <p className="text-red-600 text-center">{error}</p>}

          {result && (
            <div className="p-4 bg-gray-50 border rounded">
              <p className="text-lg font-semibold text-indigo-700">
                WBC Type: {result.class}
              </p>
              <p className="text-sm">
                Confidence: {(result.confidence).toFixed(2)}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
