import { useState } from "react";
import axios from "axios";
import ComplianceVerdict from "./ComplianceVerdict";
import ConsumerSummary from "./ConsumerSummary";
import AdditivesTable from "./AdditivesTable";
import SampleChips from "./SampleChips";
import { CameraIcon, BarcodeIcon, SparklesIcon, ScanIcon } from "./Icons";

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
          setError(`Product "${data.product.productName}" found, but no ingredients listed in Open Food Facts.`);
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
    <div className="scanner-container">
      {/* 1. Main Ingestion Surface */}
      <div className="surface-card ingestion-card">
        {/* Sub-Tabs for Input Method */}
        <div className="mode-segmented-bar">
          <button
            type="button"
            className={`mode-pill ${inputMode === "samples" ? "active" : ""}`}
            onClick={() => setInputMode("samples")}
          >
            <SparklesIcon className="mode-icon" />
            <span>Preset Examples</span>
          </button>
          <button
            type="button"
            className={`mode-pill ${inputMode === "upload" ? "active" : ""}`}
            onClick={() => setInputMode("upload")}
          >
            <CameraIcon className="mode-icon" />
            <span>Upload Photo (OCR)</span>
          </button>
          <button
            type="button"
            className={`mode-pill ${inputMode === "barcode" ? "active" : ""}`}
            onClick={() => setInputMode("barcode")}
          >
            <BarcodeIcon className="mode-icon" />
            <span>Barcode Lookup</span>
          </button>
        </div>

        {/* Mode 1: Presets */}
        {inputMode === "samples" && (
          <div className="mode-pane">
            <SampleChips onSelectSample={handleSelectSample} />
          </div>
        )}

        {/* Mode 2: Photo Upload */}
        {inputMode === "upload" && (
          <div className="mode-pane">
            <div className="dropzone-box">
              <label htmlFor="file-input" className="dropzone-label">
                <div className="dropzone-icon-circle">
                  <CameraIcon className="dropzone-icon" />
                </div>
                <div className="dropzone-text">
                  <span className="dropzone-main">Click or drop food packaging label photo</span>
                  <span className="dropzone-sub">Supports JPEG, PNG, WebP up to 5MB · Strictly in-memory OCR</span>
                </div>
              </label>
              <input
                id="file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="sr-only"
              />
            </div>

            {previewUrl && (
              <div className="preview-card">
                <img src={previewUrl} alt="Label preview" className="preview-img" />
                <div className="preview-info">
                  <span className="preview-name">{imageFile?.name}</span>
                  <div className="preview-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleRunOcr}
                      disabled={ocrLoading}
                    >
                      {ocrLoading ? "Extracting text locally..." : "Extract Text via Local OCR"}
                    </button>
                    {ocrConfidence !== null && (
                      <span className="quality-pill">Quality: {ocrConfidence}%</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode 3: Barcode */}
        {inputMode === "barcode" && (
          <div className="mode-pane">
            <div className="search-bar-row">
              <input
                type="text"
                placeholder="Enter 8 to 13 digit EAN/UPC barcode..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="search-input"
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleBarcodeLookup(barcodeInput)}
                disabled={barcodeLoading}
              >
                {barcodeLoading ? "Searching..." : "Lookup Barcode"}
              </button>
            </div>

            <div className="preset-barcodes-row">
              <span className="preset-tag-label">Popular Indian Foods:</span>
              <div className="preset-barcode-chips">
                {DEMO_BARCODES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    className="barcode-chip"
                    onClick={() => {
                      setBarcodeInput(item.code);
                      handleBarcodeLookup(item.code);
                    }}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {barcodeProduct && (
              <div className="product-match-card">
                {barcodeProduct.imageUrl && (
                  <img
                    src={barcodeProduct.imageUrl}
                    alt={barcodeProduct.productName}
                    className="product-match-thumb"
                  />
                )}
                <div className="product-match-details">
                  <span className="match-title">{barcodeProduct.productName}</span>
                  <span className="match-brand">Brand: {barcodeProduct.brand}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ingredients Textarea (Human-in-the-Loop) */}
        <div className="verification-zone">
          <div className="verification-header">
            <div className="verification-title-group">
              <span className="field-label">Ingredients Declaration</span>
              <span className="field-hint">Edit to correct OCR typos or paste raw label text</span>
            </div>
            <span className="char-badge">{ingredientsText.length} chars</span>
          </div>

          <textarea
            id="ingredients-editor"
            rows={4}
            className="editor-textarea"
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder="Ingredient declaration will appear here..."
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />

          {error && <div className="toast-error">{error}</div>}

          <div className="action-row">
            <button
              type="button"
              className="btn btn-glow-primary"
              onClick={handleRunAnalysis}
              disabled={analysisLoading || !ingredientsText.trim()}
            >
              <ScanIcon className="btn-icon" />
              <span>{analysisLoading ? "Running Regulatory Analyzer..." : "Analyze Regulatory Compliance"}</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost"
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

      {/* 2. Analysis Results Surface */}
      {analysisResult && (
        <section className="results-surface" aria-label="Regulatory Compliance Report">
          {/* Main Verdict Banner */}
          <ComplianceVerdict compliance={analysisResult.euCompliance} />

          {/* Plain-Language Bento Cards (Single Source of Truth) */}
          <ConsumerSummary analysis={analysisResult} />

          {/* Progressive Disclosure: Full Legal Matrix */}
          <AdditivesTable additives={analysisResult.flaggedAdditives} />
        </section>
      )}
    </div>
  );
}
