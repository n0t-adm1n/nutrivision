import { useState } from "react";
import axios from "axios";
import ComplianceVerdict from "./ComplianceVerdict";
import AdditivesTable from "./AdditivesTable";
import SampleChips from "./SampleChips";

const API_BASE = "http://localhost:5000/api";

const DEMO_BARCODES = [
  { code: "8901491101837", name: "Lay's India (Potato Chips)" },
  { code: "8901058852391", name: "Cerelac Wheat-Apple (Nestlé India)" },
  { code: "8901764012235", name: "Maggi 2-Minute Noodles (India)" },
  { code: "7622210449283", name: "Oreo Original (Mondelez)" },
];

export default function ScannerTab({ initialText = "" }) {
  const [inputMode, setInputMode] = useState("samples"); // "upload" | "barcode" | "samples"
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeProduct, setBarcodeProduct] = useState(null);

  // Human-in-the-loop editable text
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

  // File change handler
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

  // OCR extraction handler
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
        setError(
          "OCR completed, but no legible text was recognized. You can type or paste the ingredient list manually below."
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to process image with local OCR."
      );
    } finally {
      setOcrLoading(false);
    }
  };

  // Barcode lookup handler
  const handleBarcodeLookup = async (codeToLookup) => {
    const code = String(codeToLookup || barcodeInput).trim();
    if (!code) {
      setError("Please enter a numeric barcode to lookup.");
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
          setError(
            `Product "${data.product.productName}" found, but no ingredient text was recorded in Open Food Facts. You can paste ingredients manually below.`
          );
        }
      } else {
        setError(data.message || "Product not found in Open Food Facts database.");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to fetch product from Open Food Facts."
      );
    } finally {
      setBarcodeLoading(false);
    }
  };

  // Run regulatory analysis handler
  const handleRunAnalysis = async () => {
    if (!ingredientsText.trim()) {
      setError("Please provide or extract an ingredient list before analyzing.");
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
      setError(
        err.response?.data?.error || "Analysis failed. Please check the backend service."
      );
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Quick sample selection
  const handleSelectSample = (sampleText) => {
    setIngredientsText(sampleText);
    setError("");
    setBarcodeProduct(null);
  };

  return (
    <div className="scanner-tab-container">
      {/* Input Selection Bar */}
      <div className="card input-card">
        <div className="input-mode-tabs">
          <button
            type="button"
            className={`mode-btn ${inputMode === "samples" ? "active" : ""}`}
            onClick={() => setInputMode("samples")}
          >
            📋 Paste &amp; Demo Samples
          </button>
          <button
            type="button"
            className={`mode-btn ${inputMode === "upload" ? "active" : ""}`}
            onClick={() => setInputMode("upload")}
          >
            📷 Upload Label Photo (OCR)
          </button>
          <button
            type="button"
            className={`mode-btn ${inputMode === "barcode" ? "active" : ""}`}
            onClick={() => setInputMode("barcode")}
          >
            🏷️ Barcode (Open Food Facts)
          </button>
        </div>

        {/* Mode 1: Demo Samples */}
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
                <span className="file-hint">JPEG, PNG, WebP up to 5MB (Processed strictly in memory)</span>
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
                  <span className="preview-filesize">
                    ({(imageFile?.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleRunOcr}
                    disabled={ocrLoading}
                  >
                    {ocrLoading ? "Extracting Text locally..." : "⚡ Extract Text via Local OCR"}
                  </button>
                  {ocrConfidence !== null && (
                    <span className="ocr-badge">
                      OCR Confidence: <strong>{ocrConfidence}%</strong>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode 3: Barcode Lookup */}
        {inputMode === "barcode" && (
          <div className="mode-content barcode-section">
            <div className="barcode-input-group">
              <input
                type="text"
                placeholder="Enter 8 to 13 digit EAN/UPC barcode (e.g. 8901491101837)"
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
                {barcodeLoading ? "Searching..." : "Lookup Product"}
              </button>
            </div>

            <div className="demo-barcodes-row">
              <span className="demo-label">Demo Barcodes:</span>
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
                  <p className="product-brand">Brand: {barcodeProduct.brand}</p>
                  <div className="product-tags">
                    {barcodeProduct.nutriScore && (
                      <span className="nutriscore-badge">
                        Nutri-Score: {barcodeProduct.nutriScore}
                      </span>
                    )}
                    {barcodeProduct.offNovaGroup && (
                      <span className="nova-badge">
                        NOVA {barcodeProduct.offNovaGroup}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Human-in-the-Loop OCR & Ingredients Editor */}
        <div className="editor-container">
          <div className="editor-header">
            <label htmlFor="ingredients-editor" className="editor-label">
              <span>✍️ Human-in-the-Loop Ingredients Verification</span>
              <small className="editor-subtext">
                Verify or fix any OCR misreads (e.g. commas, INS codes) before running regulatory checks
              </small>
            </label>
            <span className="char-count">
              {ingredientsText.length} character{ingredientsText.length !== 1 ? "s" : ""}
            </span>
          </div>

          <textarea
            id="ingredients-editor"
            rows={5}
            className="ingredients-textarea"
            value={ingredientsText}
            onChange={(e) => setIngredientsText(e.target.value)}
            placeholder="Type or paste ingredients list here... (e.g. Sugar, Palmolein Oil, Colours (INS 102, E171), Maltodextrin, Glazing Agent (904))"
          />

          {error && <div className="alert-banner error">{error}</div>}

          <div className="editor-actions">
            <button
              type="button"
              className="btn btn-analyze"
              onClick={handleRunAnalysis}
              disabled={analysisLoading || !ingredientsText.trim()}
            >
              {analysisLoading ? "Running Regulatory Analyzer..." : "🚀 Run Regulatory Analysis"}
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

      {/* Results Dashboard */}
      {analysisResult && (
        <section className="results-dashboard" aria-label="Regulatory Analysis Results">
          {/* 1. EU Shelf Compliance Verdict Banner */}
          <ComplianceVerdict compliance={analysisResult.euCompliance} />

          {/* 2. Key Metrics Summary Grid */}
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-title">Flagged Additives</span>
              <strong className="metric-value">
                {analysisResult.summaryMetrics.totalFlaggedAdditives}
              </strong>
              <span className="metric-sub">
                {analysisResult.summaryMetrics.euBannedCount > 0
                  ? `${analysisResult.summaryMetrics.euBannedCount} EU-Banned`
                  : "0 EU-Banned"}
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-title">Hidden Sugars</span>
              <strong className="metric-value">
                {analysisResult.summaryMetrics.hiddenSugarsCount}
              </strong>
              <span
                className={`metric-sub ${
                  analysisResult.hiddenSugars.sugarSplittingDetected ? "warn" : ""
                }`}
              >
                {analysisResult.hiddenSugars.sugarSplittingDetected
                  ? "Sugar Splitting Detected!"
                  : "Single or no added sugar"}
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-title">Veg-Dot Blindspots</span>
              <strong className="metric-value">
                {analysisResult.summaryMetrics.vegBlindspotCount}
              </strong>
              <span
                className={`metric-sub ${
                  analysisResult.vegBlindspots.hasBlindspots ? "danger" : "safe"
                }`}
              >
                {analysisResult.vegBlindspots.hasBlindspots
                  ? "Animal/Insect Additives Present"
                  : "No hidden animal glazes"}
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-title">NOVA Processing Tier</span>
              <strong
                className={`metric-value nova-${analysisResult.novaGroup.group}`}
              >
                Group {analysisResult.novaGroup.group}
              </strong>
              <span className="metric-sub">
                {analysisResult.novaGroup.group === 4
                  ? "Ultra-Processed (UPF)"
                  : "Processed / Culinary"}
              </span>
            </div>
          </div>

          {/* 3. Cross-Jurisdiction Additives Table */}
          <AdditivesTable additives={analysisResult.flaggedAdditives} />

          {/* 4. Hidden Sugars & Sugar Splitting Warning Card */}
          <div className="card sugar-card">
            <div className="card-header-bar">
              <div className="card-title-group">
                <span className="card-icon">🍯</span>
                <div>
                  <h4>Hidden Sugars &amp; Sugar Splitting Assessment</h4>
                  <p className="card-desc">{analysisResult.hiddenSugars.explanation}</p>
                </div>
              </div>
              <span
                className={`sugar-status-pill ${
                  analysisResult.hiddenSugars.sugarSplittingDetected ? "split" : "normal"
                }`}
              >
                {analysisResult.hiddenSugars.sugarSplittingDetected
                  ? "SUGAR SPLITTING FLAGGED"
                  : "NORMAL DECLARATION"}
              </span>
            </div>

            {analysisResult.hiddenSugars.detectedSugars.length > 0 && (
              <div className="sugars-table-wrapper">
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Identified Sweetener</th>
                      <th>Scientific Type</th>
                      <th>Matched in Label</th>
                      <th>Metabolic &amp; Health Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.hiddenSugars.detectedSugars.map((s, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{s.canonicalName}</strong>
                        </td>
                        <td>
                          <span className="type-pill">{s.type}</span>
                        </td>
                        <td>
                          <code>"{s.matchedAlias}"</code>
                        </td>
                        <td className="risk-text">{s.risk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 5. FSSAI Veg-Dot Blindspot Warning (if applicable) */}
          {analysisResult.vegBlindspots.hasBlindspots && (
            <div className="card veg-alert-card">
              <div className="card-title-group">
                <span className="card-icon">🥬⚠️</span>
                <div>
                  <h4>FSSAI Vegetarian Logo Blindspot Warning</h4>
                  <p className="veg-warning-text">
                    {analysisResult.vegBlindspots.explanation}
                  </p>
                </div>
              </div>

              <div className="blindspots-list">
                {analysisResult.vegBlindspots.blindspots.map((item) => (
                  <div key={item.id} className="blindspot-item">
                    <span className="blindspot-tag">Animal / Insect Origin</span>
                    <strong>
                      {item.name} ({item.code})
                    </strong>
                    <p>{item.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. NOVA Classification Breakdown Card */}
          <div className="card nova-card">
            <div className="card-title-group">
              <span className="card-icon">🏭</span>
              <div>
                <h4>{analysisResult.novaGroup.title}</h4>
                <p className="card-desc">{analysisResult.novaGroup.summary}</p>
              </div>
            </div>

            {analysisResult.novaGroup.reasons.length > 0 && (
              <div className="nova-reasons-box">
                <strong>Triggering Industrial Processing Indicators:</strong>
                <ul>
                  {analysisResult.novaGroup.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
