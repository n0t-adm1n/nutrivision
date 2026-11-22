const path = require("path");
const Tesseract = require("tesseract.js");

const trainedDataDir = path.join(__dirname, "..");

/**
 * Extracts text from an image buffer using tesseract.js locally
 * @param {Buffer} imageBuffer - In-memory image file buffer
 * @returns {Promise<{ text: string, confidence: number }>}
 */
async function extractTextFromImage(imageBuffer) {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    throw new Error("Invalid or empty image buffer provided for OCR.");
  }

  try {
    const result = await Tesseract.recognize(imageBuffer, "eng", {
      langPath: trainedDataDir,
      logger: () => {}, // suppress verbose logs
    });

    const rawText = result?.data?.text || "";
    const confidence = result?.data?.confidence || 0;

    const cleanedText = rawText
      .replace(/\r\n/g, "\n")
      .trim();

    return {
      text: cleanedText,
      confidence: Math.round(confidence),
    };
  } catch (error) {
    console.error("OCR Extraction failed:", error);
    throw new Error(`OCR processing failed: ${error.message || "Unknown error"}`);
  }
}

module.exports = {
  extractTextFromImage,
};
