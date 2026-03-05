import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../components/ui/select";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function PredictionPage() {
  const [form, setForm] = useState({
    gender: "male",
    age: "",
    haemoglobin: "",
    platelets: "",
    wbc: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const update = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender: form.gender,
          age: Number(form.age),
          haemoglobin: Number(form.haemoglobin),
          platelets: Number(form.platelets),
          wbc: Number(form.wbc)
        })
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.error || "Prediction failed");
      setResult(data.prediction);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setForm({ gender: "male", age: "", haemoglobin: "", platelets: "", wbc: "" });
    setResult(null);
    setError("");
  };

  const getResultColor = (status) => {
    if (!status) return "text-gray-800";
    if (status.toLowerCase() === "normal") return "text-green-600";
    if (status.toLowerCase() === "borderline") return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-red-400 via-pink-400 to-purple-500 text-white rounded-t-lg p-6">
          <CardTitle className="text-3xl font-bold text-center">
            Blood Analysis Prediction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <Select
                value={form.gender}
                onValueChange={(v) => update("gender", v)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <Input
                type="number"
                min="18"
                max="65"
                placeholder="Years"
                value={form.age}
                onChange={(e) => update("age", e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter age 18-65years</p>
            </div>

            {/* Haemoglobin */}
            <div>
              <label className="block text-sm font-medium mb-1">Haemoglobin (g/dL)</label>
              <Input
                type="number"
                step="0.1"
                min="12"
                max="17"
                value={form.haemoglobin}
                onChange={(e) => update("haemoglobin", e.target.value)}
                disabled={loading}
                required
                className="border-red-400 focus:border-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">Normal: 12–16 (Female), 13–17 (Male)</p>
            </div>

            {/* Platelets */}
            <div>
              <label className="block text-sm font-medium mb-1">Platelets (10³/µL)</label>
              <Input
                type="number"
                step="1"
                min="150"
                max="450"
                value={form.platelets}
                onChange={(e) => update("platelets", e.target.value)}
                disabled={loading}
                required
                className="border-orange-400 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Normal: 157–400(10³/µL)(Female), 150–450(10³/µL)(Male)</p>
            </div>

            {/* WBC */}
            <div>
              <label className="block text-sm font-medium mb-1">WBC (10³/µL)</label>
              <Input
                type="number"
                step="0.1"
                min="4.0"
                max="11.0"
                value={form.wbc}
                onChange={(e) => update("wbc", e.target.value)}
                disabled={loading}
                required
                className="border-yellow-400 focus:border-yellow-500"
              />
              <p className="text-xs text-gray-500 mt-1">Normal: 4.5-11(10³/µL)(Female),5-10(10³/µL)(Male)</p>
            </div>

            {/* Buttons */}
            <div className="md:col-span-2 flex gap-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                {loading ? "Predicting..." : "Predict"}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={onReset} disabled={loading}>
                Reset
              </Button>
            </div>
          </form>

          {/* Error */}
          {error && <p className="text-red-600 text-sm mt-4 animate-pulse">{error}</p>}

          {/* Result */}
          {result && (
            <div className="mt-6 p-5 border rounded-lg bg-gray-50 animate-fadeIn">
              <div className={`flex items-center gap-2 mb-2 ${getResultColor(result.result)}`}>
                {result.result.toLowerCase() === "normal" ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <AlertTriangle className="h-6 w-6" />
                )}
                <h3 className="font-semibold text-xl">Result: {result.result}</h3>
              </div>
              {result.confidence != null && (
                <p className="text-sm text-gray-700">Confidence: {result.confidence}%</p>
              )}
              <p className="text-sm text-gray-700 mt-2">{result.interpretation}</p>
              {result.recommendations?.length > 0 && (
                <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                  {result.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-gray-500 mt-4">
                Disclaimer: This is informational and not a medical diagnosis. Consult a qualified professional.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
