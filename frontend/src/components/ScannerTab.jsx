import { useState } from "react";
import axios from "axios";
import ComplianceVerdict from "./ComplianceVerdict";
import ConsumerSummary from "./ConsumerSummary";
import AdditivesTable from "./AdditivesTable";
import SampleChips from "./SampleChips";

const API_BASE = "http://localhost:5000/api";

const DEMO_BARCODES = [
  { code: "8901491101837", name: "Lay's Chips (India)" },
  { code: "8901058852391", name: "Cerelac Baby Food (India)" },
  { code: "8901764012235", name: "Maggi Noodles (India)" },
  { code: "7622210449283", name: "Oreo Cookies" },
];

export default function ScannerTab({ initialText = "" }) {
  const [inputMode, setInputMode] = useState("samples"); // "samples" | "upload" | "barcode"
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeProduct, setBarcodeProduct] = useState(null);

  const [ingredientsText, setIngredientsText] = useState(
    initialText ||
      "Sugar, Acidity Regulators (INS 330), Fruit Powder (1%), Colours (INS 171, INS 110, INS 102), Maltodextrin, Stabilizer (INS 466), Artificial Sweetener (INS 955)"
  );

  const [ocrLoading, setOcrLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState(null);

  const [error, setError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleFileChange = (e) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Please upload a valid JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file exceeds the 5MB maximum limit.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setOcrConfidence(null);
  };

  const handleRunOcr = async () => {
    if (!imageFile) {
      setError("Please select an image file first.");
      return;
    }

    setOcrLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await axios.post(`${API_BASE}/ocr`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const extracted = response.data.text || "";
      setIngredientsText(extracted);
      setOcrConfidence(response.data.confidence);

      if (!extracted.trim()) {
        setError("OCR completed, but no legible text was recognized. You can type or paste ingredients below.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to process image with local OCR.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleBarcodeLookup = async (codeToLookup) => {
    const code = String(codeToLookup || barcodeInput).trim();
    if (!code) {
      setError("Please enter a numeric barcode.");
      return;
    }

    setBarcodeLoading(true);
    setError("");
    setBarcodeProduct(null);

    try {
      const response = await axios.get(`${API_BASE}/barcode/${code}`);
      const data = response.data;

      if (data.found && data.product) {
        setBarcodeProduct(data.product);
        if (data.product.ingredientsText) {
          setIngredientsText(data.product.ingredientsText);
          if (data.analysis) {
            setAnalysisResult(data.analysis);
          }
        } else {
          setError(`Product "${data.product.productName}" found, but no ingredients listed in database.`);
        }
      } else {
        setError(data.message || "Product not found.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch barcode info.");
    } finally {
      setBarcodeLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!ingredientsText.trim()) {
      setError("Please enter or scan an ingredient list first.");
      return;
    }

    setAnalysisLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE}/analyze-text`, {
        ingredientsText: ingredientsText.trim(),
      });
      setAnalysisResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSelectSample = (sampleText) => {
    setIngredientsText(sampleText);
    setError("");
    setBarcodeProduct(null);
  };

  return (
    <div className="scanner-tab-container">
      {/* 1. Input Box */}
      <div className="card input-card">
        <div className="input-mode-tabs">
          <button
            type="button"
            className={`mode-btn ${inputMode === "samples" ? "active" : ""}`}
            onClick={() => setInputMode("samples")}
          >
            📋 Popular Examples
          </button>
          <button
            type="button"
            className={`mode-btn ${inputMode === "upload" ? "active" : ""}`}
            onClick={() => setInputMode("upload")}
          >
            📷 Photo Upload
          </button>
          <button
            type="button"
            className={`mode-btn ${inputMode === "barcode" ? "active" : ""}`}
            onClick={() => setInputMode("barcode")}
          >
            🏷️ Barcode
          </button>
        </div>

        {/* Mode 1: Samples */}
        {inputMode === "samples" && (
          <div className="mode-content">
            <SampleChips onSelectSample={handleSelectSample} />
          </div>
        )}

        {/* Mode 2: Photo Upload */}
        {inputMode === "upload" && (
          <div className="mode-content upload-section">
            <div className="upload-box">
              <label htmlFor="file-input" className="file-label">
                <span className="upload-icon">📸</span>
                <strong>Choose a food label photo</strong>
                <span className="file-hint">JPEG, PNG, WebP (processed strictly in memory, never saved)</span>
              </label>
              <input
                id="file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden-file-input"
              />
            </div>

            {previewUrl && (
              <div className="preview-row">
                <div className="preview-thumbnail">
                  <img src={previewUrl} alt="Label preview" />
                </div>
                <div className="preview-meta">
                  <span className="preview-filename">{imageFile?.name}</span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleRunOcr}
                    disabled={ocrLoading}
                  >
                    {ocrLoading ? "Extracting text..." : "⚡ Scan Photo (OCR)"}
                  </button>
                  {ocrConfidence !== null && (
                    <span className="ocr-badge">OCR Quality: {ocrConfidence}%</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode 3: Barcode */}
        {inputMode === "barcode" && (
          <div className="mode-content barcode-section">
            <div className="barcode-input-group">
              <input
                type="text"
                placeholder="Enter barcode number (e.g. 8901491101837)"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="barcode-input"
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleBarcodeLookup(barcodeInput)}
                disabled={barcodeLoading}
              >
                {barcodeLoading ? "Searching..." : "Lookup"}
              </button>
            </div>

            <div className="demo-barcodes-row">
              <span className="demo-label">Quick Demos:</span>
              {DEMO_BARCODES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className="demo-barcode-btn"
                  onClick={() => {
                    setBarcodeInput(item.code);
                    handleBarcodeLookup(item.code);
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>

            {barcodeProduct && (
              <div className="barcode-product-card">
                {barcodeProduct.imageUrl && (
                  <img
                    src={barcodeProduct.imageUrl}
                    alt={barcodeProduct.productName}
                    className="product-thumb"
                  />
                )}
                <div className="product-info">
                  <h4>{barcodeProduct.productName}</h4>
                  <p className="product-brand">{barcodeProduct.brand}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ingredients Text Box */}
        <div className="editor-container">
          <div className="editor-header">
            <span className="editor-label">Ingredients to Analyze:</span>
            <span className="char-count">{ingredientsText.length} characters</span>
          </div>

          <textarea
            id="ingredients-editor"
            rows={4}
            className="ingredients-textarea"
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder="Ingredients text appears here. You can edit or paste ingredients directly..."
          />

          {error && <div className="alert-banner error">{error}</div>}

          <div className="editor-actions">
            <button
              type="button"
              className="btn btn-analyze"
              onClick={handleRunAnalysis}
              disabled={analysisLoading || !ingredientsText.trim()}
            >
              {analysisLoading ? "Checking Ingredients..." : "🔍 Check Ingredients"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIngredientsText("");
                setAnalysisResult(null);
                setError("");
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* 2. Results Section */}
      {analysisResult && (
        <section className="results-dashboard" aria-label="Analysis Results">
          {/* Main Verdict Banner */}
          <ComplianceVerdict compliance={analysisResult.euCompliance} />

          {/* Quick Metrics Bar */}
          <div className="quick-metrics-row">
            <div className="quick-metric">
              <span className="qm-label">EU Banned</span>
              <strong className={`qm-val ${analysisResult.summaryMetrics.euBannedCount > 0 ? "danger" : "safe"}`}>
                {analysisResult.summaryMetrics.euBannedCount > 0 ? "Yes (Banned)" : "None"}
              </strong>
            </div>

            <div className="quick-metric">
              <span className="qm-label">Child Warning</span>
              <strong className={`qm-val ${analysisResult.summaryMetrics.annexVDyeCount > 0 ? "warn" : "safe"}`}>
                {analysisResult.summaryMetrics.annexVDyeCount > 0 ? "Required" : "None"}
              </strong>
            </div>

            <div className="quick-metric">
              <span className="qm-label">Sugar Splitting</span>
              <strong className={`qm-val ${analysisResult.hiddenSugars.sugarSplittingDetected ? "warn" : "safe"}`}>
                {analysisResult.hiddenSugars.sugarSplittingDetected ? "Yes (Splitting)" : "Normal"}
              </strong>
            </div>

            <div className="quick-metric">
              <span className="qm-label">Veg Dot Safe</span>
              <strong className={`qm-val ${analysisResult.vegBlindspots.hasBlindspots ? "warn" : "safe"}`}>
                {analysisResult.vegBlindspots.hasBlindspots ? "Blindspot Found" : "Safe"}
              </strong>
            </div>

            <div className="quick-metric">
              <span className="qm-label">Processing</span>
              <strong className={`qm-val ${analysisResult.novaGroup.group === 4 ? "danger" : "safe"}`}>
                {analysisResult.novaGroup.group === 4 ? "Ultra-Processed" : "Whole Food"}
              </strong>
            </div>
          </div>

          {/* Plain English Consumer Breakdown */}
          <ConsumerSummary analysis={analysisResult} />

          {/* Collapsible Advanced Legal Breakdown */}
          <AdditivesTable additives={analysisResult.flaggedAdditives} />
        </section>
      )}
    </div>
  );
}
