import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { Activity, Microscope } from "lucide-react";

export default function PredictionHub() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto py-14 px-4">
      {/* Page Heading */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          AI-Based Blood Prediction Hub
        </h1>
        <p className="text-gray-600 max-w-3xl mx-auto">
          This intelligent prediction hub leverages Machine Learning and Deep Learning
          techniques to analyze blood parameters and microscopic blood cell images
          for early insights into potential health conditions.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* LEFT – BLOOD DISEASE PREDICTION */}
        <Card className="hover:shadow-2xl transition duration-300 border-t-4 border-red-500">
          <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Activity className="h-6 w-6" />
              Blood Analysis & Disease Prediction
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 pt-6 text-gray-700">
            <p className="text-sm">
              This prediction module analyzes key blood parameters using
              machine learning models to assist in identifying potential
              blood-related disorders.
            </p>

            {/* Parameters */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                Parameters Used:
              </h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Hemoglobin (Hb)</li>
                <li>White Blood Cell (WBC) Count</li>
                <li>Platelet Count</li>
                <li>Age and Gender</li>
              </ul>
            </div>

            {/* Diseases */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                Possible Conditions Predicted:
              </h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Anemia</li>
                <li>Infections</li>
                <li>Thrombocytopenia</li>
                <li>Leukemia (early indicators)</li>
                <li>General blood abnormalities</li>
              </ul>
            </div>

            <p className="text-xs text-gray-500">
              ⚠️ These predictions are for decision support only and should
              not replace professional medical diagnosis.
            </p>

            <Button
              className="w-full mt-3"
              onClick={() => navigate("/disease-prediction")}
            >
              Go to Blood Disease Prediction
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT – WBC IMAGE PREDICTION */}
        <Card className="hover:shadow-2xl transition duration-300 border-t-4 border-indigo-500">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Microscope className="h-6 w-6" />
              White Blood Cell Image Prediction
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 pt-6 text-gray-700">
            <p className="text-sm">
              This module uses deep learning (CNN / Transfer Learning) to
              classify microscopic images of white blood cells, which play
              a crucial role in the human immune system.
            </p>

            {/* WBC Types */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                White Blood Cell Types Identified:
              </h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><b>Neutrophils</b> – Fight bacterial infections</li>
                <li><b>Lymphocytes</b> – Key role in immunity (B & T cells)</li>
                <li><b>Monocytes</b> – Remove dead or damaged cells</li>
                <li><b>Eosinophils</b> – Involved in allergic reactions</li>
                <li><b>Basophils</b> – Release histamine in immune responses</li>
              </ul>
            </div>

            {/* Use Case */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                Why This Prediction Matters:
              </h4>
              <p className="text-sm">
                Abnormal distribution of WBC types can indicate infections,
                immune disorders, inflammation, or blood cancers. Automated
                image-based classification assists pathologists and improves
                diagnostic efficiency.
              </p>
            </div>

            <p className="text-xs text-gray-500">
              ⚠️ Image-based predictions are supportive tools and must be
              validated by medical professionals.
            </p>

            <Button
              className="w-full mt-3"
              onClick={() => navigate("/wbc-prediction")}
            >
              Go to WBC Image Prediction
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
