
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// --------------------------------------------------
// Load nutritional dictionary
// --------------------------------------------------

const dictionaryPath = path.join(
  __dirname,
  "data",
  "nutritionDictionary.json"
);

const nutritionDictionary = JSON.parse(
  fs.readFileSync(dictionaryPath, "utf-8")
);

if (!Array.isArray(nutritionDictionary)) {
  throw new Error("Nutrition dictionary must contain an array.");
}

// --------------------------------------------------
// Multer configuration
// --------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed."));
    }
  },
});

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Use a model recommended by Google's API response.
// Additional models can be configured in .env.

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",

  ...(process.env.GEMINI_FALLBACK_MODELS || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean),
].filter((model, index, models) =>
  models.indexOf(model) === index
);

const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 60000;

// --------------------------------------------------
// Helper: Normalize food names
// --------------------------------------------------

function normalizeFoodName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// --------------------------------------------------
// Helper: Match AI prediction against dictionary
// --------------------------------------------------

function matchFoodInDictionary(predictedLabel) {
  if (!predictedLabel) {
    return null;
  }

  const normalized = normalizeFoodName(predictedLabel);

  // Prefer exact matching by food ID or food name.
  return (
    nutritionDictionary.find((item) => {
      const normalizedId = normalizeFoodName(item.food_id);
      const normalizedName = normalizeFoodName(item.name);

      return (
        normalized === normalizedId ||
        normalized === normalizedName
      );
    }) || null
  );
}

// --------------------------------------------------
// Helper: Wait for a specified duration
// --------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --------------------------------------------------
// Helper: Get retry delay from API response
// --------------------------------------------------

function getRetryDelay(error, attempt) {
  const headers = error.response?.headers || {};

  // Respect Retry-After header if provided.
  const retryAfter = headers["retry-after"];

  if (retryAfter) {
    const seconds = Number(retryAfter);

    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, 30000);
    }

    const dateDelay = Date.parse(retryAfter) - Date.now();

    if (Number.isFinite(dateDelay) && dateDelay > 0) {
      return Math.min(dateDelay, 30000);
    }
  }

  // Otherwise use exponential backoff.
  const exponentialDelay = 1000 * Math.pow(2, attempt);

  const jitter = Math.random() * 500;

  return exponentialDelay + jitter;
}

// --------------------------------------------------
// Helper: Call Gemini with retry and fallback
// --------------------------------------------------

async function analyzeWithGemini(payload) {
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    console.log(`Trying Gemini model: ${model}`);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": GEMINI_API_KEY,
            },
            timeout: REQUEST_TIMEOUT,
          }
        );

        console.log(`Successfully used model: ${model}`);

        return {
          response,
          model,
        };

      } catch (error) {
        lastError = error;

        const status = error.response?.status;

        console.warn(
          `Model ${model} failed. Status: ${status || error.code}`
        );

        // Retry temporary service-unavailable errors.
        if (status === 503) {
          if (attempt < MAX_RETRIES) {
            const delay = getRetryDelay(error, attempt);

            console.warn(
              `Gemini unavailable. Retrying in ${Math.round(delay)}ms`
            );

            await sleep(delay);
            continue;
          }

          // All retries exhausted. Try another configured model.
          break;
        }

        // Retry 429 only when Google provides retry information.
        if (status === 429) {
          const retryInfo = error.response?.data?.error?.details
            ?.find((detail) => detail["@type"]?.includes("RetryInfo"));

          const retryDelay = retryInfo?.retryDelay;

          if (retryDelay && attempt < MAX_RETRIES) {
            const seconds = parseFloat(retryDelay);

            if (Number.isFinite(seconds) && seconds >= 0) {
              const delay = Math.min(seconds * 1000, 30000);

              console.warn(
                `Rate limit reached. Retrying in ${delay}ms`
              );

              await sleep(delay);
              continue;
            }
          }

          // Don't repeatedly retry quota errors.
          throw error;
        }

        // Other errors are not automatically retried.
        throw error;
      }
    }

    console.warn(`Moving to next model after ${model} failed.`);
  }

  throw lastError;
}

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "NutriVision backend is running.",
  });
});

// --------------------------------------------------
// Get all supported foods
// --------------------------------------------------

app.get("/api/foods", (req, res) => {
  res.json({
    foods: nutritionDictionary,
  });
});

// --------------------------------------------------
// Image recognition + nutritional dictionary mapping
// --------------------------------------------------

app.post(
  "/api/analyze",
  upload.single("image"),
  async (req, res) => {
    try {
      // Check uploaded image.
      if (!req.file) {
        return res.status(400).json({
          error: "No image file uploaded.",
        });
      }

      // Check Gemini API key.
      if (!GEMINI_API_KEY) {
        return res.status(500).json({
          error: "Server is missing GEMINI_API_KEY in backend/.env.",
        });
      }

      // Convert image to Base64.
      const base64Image = req.file.buffer.toString("base64");

      // Prepare supported food names.
      const supportedNames = nutritionDictionary
        .map((item) => item.name)
        .join(", ");

      // Gemini prompt.
      const prompt = `
Identify the main food dish in this image.

Supported food items:
${supportedNames}

Instructions:

1. Identify the main food item visible in the image.
2. If it matches a supported food item, return its exact name
   from the supported food list.
3. If it does not match any supported food item, return a
   short and accurate food name.
4. Return ONLY the food name.
5. Do not include explanations, punctuation, or additional text.
      `.trim();

      // Prepare Gemini request.
      const payload = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: req.file.mimetype,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 50,
        },
      };

      // Call Gemini.
      const {
        response: geminiResponse,
        model: usedModel,
      } = await analyzeWithGemini(payload);

      // Extract AI response.
      const parts =
        geminiResponse.data?.candidates?.[0]?.content?.parts || [];

      const rawLabel = parts
        .map((part) => part.text || "")
        .join(" ")
        .trim()
        .replace(/[.!?]+$/, "");

      if (!rawLabel) {
        console.error(
          "Gemini returned no usable food identification.",
          geminiResponse.data?.candidates?.[0]?.finishReason
        );

        return res.status(502).json({
          error: "AI could not identify the food in this image.",
        });
      }

      // Match prediction against nutritional dictionary.
      const matchedFood = matchFoodInDictionary(rawLabel);

      // Return results.
      return res.json({
        predictedLabel: rawLabel,
        modelUsed: usedModel,
        matched: Boolean(matchedFood),
        food: matchedFood,
      });

    } catch (error) {
      const status = error.response?.status;

      console.error(
        "Inference error:",
        status,
        error.response?.data || error.message
      );

      if (status === 503) {
        return res.status(503).json({
          error: "Gemini service is temporarily unavailable. Please try again shortly.",
        });
      }

      if (status === 429) {
        return res.status(429).json({
          error: "Gemini API quota or rate limit reached. Please check your Google AI Studio usage limits.",
        });
      }

      if (status === 400) {
        return res.status(400).json({
          error: "Gemini rejected the image or request. Please check the uploaded image.",
        });
      }

      if (status === 401 || status === 403) {
        return res.status(502).json({
          error: "Gemini API authentication or permission error. Check your API key and project access.",
        });
      }

      if (status === 404) {
        return res.status(502).json({
          error: "Gemini model not found or unavailable. Check GEMINI_MODEL in your .env file.",
        });
      }

      return res.status(502).json({
        error: "Failed to analyze food image using the AI service.",
      });
    }
  }
);

// --------------------------------------------------
// Multer and general error handler
// --------------------------------------------------

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error:
        err.code === "LIMIT_FILE_SIZE"
          ? "Image must not exceed 5MB."
          : err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      error: err.message || "Something went wrong.",
    });
  }

  next();
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(`NutriVision backend running on port ${PORT}`);
  console.log(`Configured Gemini models: ${GEMINI_MODELS.join(", ")}`);
});
