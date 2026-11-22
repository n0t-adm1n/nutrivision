const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { extractTextFromImage } = require("./services/ocrService");
const { analyzeIngredients } = require("./services/analyzerService");
const { fetchAndAnalyzeBarcode } = require("./services/openFoodFactsService");

const app = express();
const PORT = process.env.PORT || 5000;

// --------------------------------------------------
// Middleware
// --------------------------------------------------
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// --------------------------------------------------
// In-Memory Curated Data Sources
// --------------------------------------------------
const comparisonsPath = path.join(__dirname, "data", "dualQualityPairs.json");
const rulesPath = path.join(__dirname, "data", "regulatoryRules.json");

let dualQualityPairs = [];
let regulatoryRules = [];

try {
  dualQualityPairs = JSON.parse(fs.readFileSync(comparisonsPath, "utf-8"));
  regulatoryRules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
} catch (err) {
  console.error("Failed to load backend dataset files:", err.message);
}

// --------------------------------------------------
// Multer Configuration (Strictly In-Memory)
// --------------------------------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
        )
      );
    }
  },
});

// --------------------------------------------------
// Routes
// --------------------------------------------------

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "NutriVision Food Label Regulatory & Dual-Quality Analyzer (India vs. EU)",
    rulesCount: regulatoryRules.length,
    comparisonsCount: dualQualityPairs.length,
  });
});

// 2. OCR Text Extraction (Stateless In-Memory)
app.post("/api/ocr", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        error: "No image file uploaded. Please upload a clear photo of the food ingredients label.",
      });
    }

    // Process image buffer in memory
    const { text, confidence } = await extractTextFromImage(req.file.buffer);

    // Buffer is automatically freed when req is garbage collected
    return res.json({
      success: true,
      text: text || "",
      confidence,
      characterCount: text ? text.length : 0,
      note: "Image processed strictly in memory and discarded.",
    });
  } catch (error) {
    console.error("OCR Route Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to extract text from the uploaded image.",
    });
  }
});

// 3. Deterministic Regulatory Analysis
app.post("/api/analyze-text", (req, res) => {
  try {
    const { ingredientsText } = req.body;

    if (!ingredientsText || typeof ingredientsText !== "string" || !ingredientsText.trim()) {
      return res.status(400).json({
        error: "Please provide a non-empty 'ingredientsText' string in the request body.",
      });
    }

    const analysis = analyzeIngredients(ingredientsText);
    return res.json(analysis);
  } catch (error) {
    console.error("Analysis Error:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred during regulatory analysis.",
    });
  }
});

// 4. Open Food Facts Barcode Lookup & Regulatory Analysis
app.get("/api/barcode/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const result = await fetchAndAnalyzeBarcode(code);

    if (!result.found) {
      return res.status(404).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error("Barcode Route Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to retrieve or process barcode data.",
    });
  }
});

// 5. Curated India vs. EU Dual-Quality Dataset
app.get("/api/comparisons", (req, res) => {
  res.json({
    count: dualQualityPairs.length,
    products: dualQualityPairs,
  });
});

// 6. Regulatory Rules Database (Transparency)
app.get("/api/rules", (req, res) => {
  res.json({
    count: regulatoryRules.length,
    rules: regulatoryRules,
  });
});

// --------------------------------------------------
// Error Handling Middleware
// --------------------------------------------------
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "Image exceeds the maximum allowed size of 5MB.",
      });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err) {
    return res.status(400).json({
      error: err.message || "An unexpected server error occurred.",
    });
  }

  next();
});

// --------------------------------------------------
// Start Server
// --------------------------------------------------
app.listen(PORT, () => {
  console.log(`NutriVision Regulatory Analyzer running on port ${PORT}`);
  console.log(`Loaded ${regulatoryRules.length} regulatory rules and ${dualQualityPairs.length} dual-quality pairs.`);
});

module.exports = app;
