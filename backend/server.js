const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Load local JSON nutritional dictionary
const dictionaryPath = path.join(__dirname, "data", "nutritionDictionary.json");
const nutritionDictionary = JSON.parse(fs.readFileSync(dictionaryPath, "utf-8"));

// Stateless in-memory upload (max 5MB, images only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, and WebP images are allowed."));
  },
});

// Helper: Match AI predicted label against local dictionary safely
function matchFoodInDictionary(predictedLabel) {
  if (!predictedLabel) return null;
  const normalized = predictedLabel.toLowerCase().replace(/[_-]/g, " ").trim();

  return (
    nutritionDictionary.find(
      (item) =>
        item.food_id.toLowerCase().replace(/[_-]/g, " ") === normalized ||
        item.name.toLowerCase() === normalized ||
        normalized.includes(item.food_id.toLowerCase().replace(/[_-]/g, " ")) ||
        item.name.toLowerCase().includes(normalized)
    ) || null
  );
}

// Health check & list all supported dictionary items
app.get("/api/foods", (req, res) => {
  res.json({ foods: nutritionDictionary });
});

// Image recognition + dictionary mapping endpoint
app.post("/api/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded." });
    }

    const apiKey = process.env.HF_API_KEY;
    const model = process.env.HF_MODEL || "rajistics/finetuned-indian-food";

    if (!apiKey || apiKey === "hf_your_actual_token_here") {
      return res.status(500).json({
        error: "Server is missing a valid HF_API_KEY in backend/.env.",
      });
    }

    // Forward raw image buffer directly to Hugging Face Inference API
    const hfResponse = await axios.post(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      req.file.buffer,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": req.file.mimetype || "application/octet-stream",
        },
        timeout: 30000,
      }
    );

    const predictions = Array.isArray(hfResponse.data) ? hfResponse.data : [];
    const topPrediction = predictions[0] || { label: "Unknown", score: 0 };
    const matchedFood = matchFoodInDictionary(topPrediction.label);

    return res.json({
      predictedLabel: topPrediction.label,
      confidence: Number((topPrediction.score * 100).toFixed(1)),
      matched: Boolean(matchedFood),
      food: matchedFood,
      topPredictions: predictions.slice(0, 3),
    });
  } catch (err) {
    const status = err.response?.status;
    if (status === 503) {
      return res.status(503).json({
        error: "AI model is warming up on Hugging Face. Wait 15 seconds and retry.",
      });
    }
    console.error("Inference error:", err.response?.data || err.message);
    return res.status(500).json({
      error: "Failed to analyze food image via AI service.",
    });
  }
});

// Multer error handler
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

app.listen(PORT, () => {
  console.log(`NutriVision backend running on http://localhost:${PORT}`);
});