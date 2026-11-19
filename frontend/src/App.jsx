import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = "http://localhost:5000/api";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

function App() {
  const [foods, setFoods] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [aiResult, setAiResult] = useState(null);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    axios
      .get(`${API_BASE}/foods`)
      .then((res) => setFoods(res.data.foods || []))
      .catch(() => setError("Could not connect to backend. Is server.js running?"));
  }, []);

  const handleFileChange = (e) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid format. Please upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image exceeds ${MAX_SIZE_MB}MB limit.`);
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAiResult(null);
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      setError("Please select a food image first.");
      return;
    }

    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const { data } = await axios.post(`${API_BASE}/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAiResult(data);
      if (data.matched && data.food) {
        setSelectedFoodId(data.food.food_id);
        setQuantity(1);
      } else if (foods.length > 0) {
        setSelectedFoodId(foods[0].food_id);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setPreviewUrl(null);
    setAiResult(null);
    setSelectedFoodId("");
    setQuantity(1);
    setError("");
  };

  const selectedFood = foods.find((f) => f.food_id === selectedFoodId);
  const safeQty = Math.max(0, Number(quantity) || 0);

  return (
    <div className="container">
      <header className="header">
        <h1>NutriVision</h1>
        <p>Stateless AI Food Recognition &amp; Macronutrient Estimator</p>
      </header>

      <main className="grid">
        {/* Module 6.1: Image Submission */}
        <section className="card">
          <h2>1. Upload Food Image</h2>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="file-input"
          />

          {previewUrl && (
            <div className="preview-box">
              <img src={previewUrl} alt="Food preview" />
            </div>
          )}

          {error && <p className="error">{error}</p>}

          <div className="actions">
            <button onClick={handleAnalyze} disabled={loading || !imageFile}>
              {loading ? "Analyzing..." : "Analyze Food"}
            </button>
            <button className="secondary" onClick={handleReset}>
              Clear Session
            </button>
          </div>
          <small className="privacy-note">
            Privacy-first: Images are processed strictly in memory and never stored.
          </small>
        </section>

        {/* Modules 6.3 & 6.4: Nutritional Analysis & Manual Editing */}
        <section className="card">
          <h2>2. Nutritional Breakdown</h2>

          {aiResult && (
            <div className={`badge ${aiResult.matched ? "success" : "warn"}`}>
              <strong>AI Detected:</strong> {aiResult.predictedLabel} ({aiResult.confidence}%)
              {!aiResult.matched && (
                <span> — Not in local dictionary; please select manually below.</span>
              )}
            </div>
          )}

          <div className="control-group">
            <label htmlFor="food-select">Food Item (Verify or Correct):</label>
            <select
              id="food-select"
              value={selectedFoodId}
              onChange={(e) => setSelectedFoodId(e.target.value)}
            >
              <option value="">-- Select a dish --</option>
              {foods.map((food) => (
                <option key={food.food_id} value={food.food_id}>
                  {food.name} ({food.base_quantity})
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="qty-input">
              Quantity Multiplier {selectedFood ? `(× ${selectedFood.base_quantity})` : ""}:
            </label>
            <input
              id="qty-input"
              type="number"
              min="0.25"
              step="0.25"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={!selectedFood}
            />
          </div>

          {selectedFood ? (
            <div className="macros">
              <div className="macro-card">
                <span>Calories</span>
                <strong>{(selectedFood.calories * safeQty).toFixed(1)} kcal</strong>
              </div>
              <div className="macro-card">
                <span>Protein</span>
                <strong>{(selectedFood.protein * safeQty).toFixed(1)} g</strong>
              </div>
              <div className="macro-card">
                <span>Carbs</span>
                <strong>{(selectedFood.carbs * safeQty).toFixed(1)} g</strong>
              </div>
              <div className="macro-card">
                <span>Fat</span>
                <strong>{(selectedFood.fat * safeQty).toFixed(1)} g</strong>
              </div>
            </div>
          ) : (
            <p className="placeholder">
              Upload an image or pick a dish from the dropdown to calculate macros.
            </p>
          )}

          <small className="disclaimer">
            * Values are estimates based on standard Indian portions and are not medical advice.
          </small>
        </section>
      </main>
    </div>
  );
}

export default App;