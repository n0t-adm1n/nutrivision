const axios = require("axios");
const { analyzeIngredients } = require("./analyzerService");

const OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v2/product";

/**
 * Fetches product metadata from Open Food Facts by barcode and runs regulatory analysis
 * @param {string} barcode - EAN/UPC barcode string
 * @returns {Promise<object>}
 */
async function fetchAndAnalyzeBarcode(barcode) {
  const cleanBarcode = String(barcode || "").trim();
  if (!cleanBarcode || !/^\d+$/.test(cleanBarcode)) {
    throw new Error("Invalid barcode. Must be a numeric string.");
  }

  try {
    const url = `${OPEN_FOOD_FACTS_URL}/${cleanBarcode}.json`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "NutriVision-Food-Label-Analyzer/1.0 (academic-regulatory-research)",
      },
      timeout: 10000,
    });

    const data = response.data;
    if (!data || data.status !== 1 || !data.product) {
      return {
        found: false,
        barcode: cleanBarcode,
        message: `Product with barcode ${cleanBarcode} was not found in the Open Food Facts global database.`,
      };
    }

    const p = data.product;
    const productName = p.product_name || p.product_name_en || "Unknown Product";
    const brand = p.brands || p.brands_tags?.[0] || "Unknown Brand";
    const ingredientsText =
      p.ingredients_text ||
      p.ingredients_text_en ||
      p.ingredients_text_with_allergens ||
      "";
    const nutriScore = (p.nutriscore_grade || "").toUpperCase() || null;
    const offNovaGroup = p.nova_group || null;
    const imageUrl = p.image_url || p.image_front_url || null;
    const quantity = p.quantity || null;

    let analysis = null;
    if (ingredientsText) {
      analysis = analyzeIngredients(ingredientsText);
    }

    return {
      found: true,
      barcode: cleanBarcode,
      product: {
        productName,
        brand,
        ingredientsText,
        nutriScore,
        offNovaGroup,
        imageUrl,
        quantity,
        countries: p.countries || null,
      },
      hasIngredients: Boolean(ingredientsText),
      analysis,
    };
  } catch (error) {
    console.error("Open Food Facts fetch error:", error.message);
    if (error.code === "ECONNABORTED" || error.code === "ENOTFOUND") {
      throw new Error("Failed to reach Open Food Facts network service. Please check your internet connection.");
    }
    throw new Error(`Open Food Facts query failed: ${error.message}`);
  }
}

module.exports = {
  fetchAndAnalyzeBarcode,
};
