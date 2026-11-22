import { useState, useEffect } from "react";
import axios from "axios";
import { ScaleIcon, ChevronDown, ChevronUp, ArrowUpRight } from "./Icons";

const API_BASE = "http://localhost:5000/api";

export default function DualQualityTab({ onInspectInScanner }) {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("lays-classic");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_BASE}/comparisons`)
      .then((res) => {
        const list = res.data.products || [];
        setProducts(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch comparisons:", err.message);
        setError("Unable to connect to backend for live comparisons.");
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedId);

  return (
    <div className="dual-quality-wrapper">
      {/* Editorial Intro Banner */}
      <div className="surface-card intro-banner">
        <div className="intro-icon-box">
          <ScaleIcon className="intro-icon" />
        </div>
        <div className="intro-text">
          <h2 className="intro-title">Corporate Dual Quality: India vs. European Union</h2>
          <p className="intro-body">
            Multinational food brands frequently reformulate flagship products across markets. In developing jurisdictions with permissive standards like India, identical brands commonly utilize high-saturated palmolein oil, synthetic azo dyes, and higher refined sugar loads compared to their European counterparts.
          </p>
        </div>
      </div>

      {loading && <div className="loading-state">Loading product comparisons...</div>}
      {error && <div className="toast-error">{error}</div>}

      {/* Product Selector Scroll */}
      {products.length > 0 && (
        <div className="product-scroll-container">
          <span className="scroll-caption">Select Comparative Case Study:</span>
          <div className="scroll-pills-row">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`product-selector-pill ${selectedId === p.id ? "active" : ""}`}
                onClick={() => setSelectedId(p.id)}
              >
                <span className="pill-brand-label">{p.brand}</span>
                <span className="pill-product-label">{p.productName.split("(")[0].trim()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Comparative Surface */}
      {selectedProduct && (
        <div className="surface-card comparison-display-card">
          <div className="comparison-card-header">
            <div>
              <span className="category-meta">{selectedProduct.category}</span>
              <h3 className="product-headline">{selectedProduct.productName}</h3>
              <span className="brand-meta">Corporation: {selectedProduct.brand}</span>
            </div>

            {onInspectInScanner && selectedProduct.india.keyIngredients && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => onInspectInScanner(selectedProduct.india.keyIngredients)}
              >
                <span>Audit Indian Recipe in Scanner</span>
                <ArrowUpRight className="btn-inline-icon" />
              </button>
            )}
          </div>

          {/* Side-by-Side Matrix Table */}
          <div className="table-container">
            <table className="comparison-matrix">
              <thead>
                <tr>
                  <th style={{ width: "24%" }}>Nutritional &amp; Formulation Factor</th>
                  <th style={{ width: "38%" }}>
                    <div className="jurisdiction-th">
                      <span className="flag-circle">IN</span>
                      <span>India Market Pack (FSSAI)</span>
                    </div>
                  </th>
                  <th style={{ width: "38%" }}>
                    <div className="jurisdiction-th">
                      <span className="flag-circle eu">EU</span>
                      <span>European Union / UK Pack</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="factor-cell">
                    <span className="factor-title">Frying &amp; Fat Base</span>
                    <span className="factor-sub">Lipid profile &amp; saturated fats</span>
                  </td>
                  <td className="diff-cell-warn">
                    <span className="spec-val-danger">{selectedProduct.india.oilBase}</span>
                    {selectedProduct.india.saturatedFatPer100g && (
                      <span className="sat-fat-note">Saturated Fat: {selectedProduct.india.saturatedFatPer100g}</span>
                    )}
                  </td>
                  <td className="diff-cell-safe">
                    <span className="spec-val-success">{selectedProduct.eu.oilBase}</span>
                    {selectedProduct.eu.saturatedFatPer100g && (
                      <span className="sat-fat-note">Saturated Fat: {selectedProduct.eu.saturatedFatPer100g}</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="factor-cell">
                    <span className="factor-title">Sugar Density</span>
                    <span className="factor-sub">Grams per 100g</span>
                  </td>
                  <td className="diff-cell-warn">
                    <div className="sugar-stat-box">
                      <span className="sugar-number val-danger">{selectedProduct.india.sugarPer100g}g</span>
                      <div className="sugar-progress-track">
                        <div
                          className="sugar-fill-in"
                          style={{
                            width: `${Math.min(100, (selectedProduct.india.sugarPer100g / 60) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="diff-cell-safe">
                    <div className="sugar-stat-box">
                      <span className="sugar-number val-success">{selectedProduct.eu.sugarPer100g}g</span>
                      <div className="sugar-progress-track">
                        <div
                          className="sugar-fill-eu"
                          style={{
                            width: `${Math.min(100, (selectedProduct.eu.sugarPer100g / 60) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="factor-cell">
                    <span className="factor-title">Colorings &amp; Additives</span>
                    <span className="factor-sub">Azo dyes vs. natural extracts</span>
                  </td>
                  <td>
                    {selectedProduct.india.flaggedAdditives.length > 0 ? (
                      <div className="badges-flex">
                        {selectedProduct.india.flaggedAdditives.map((f, i) => (
                          <span key={i} className="additive-chip-warn">{f}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="subtle-dash">—</span>
                    )}
                  </td>
                  <td>
                    {selectedProduct.eu.flaggedAdditives.length > 0 ? (
                      <div className="badges-flex">
                        {selectedProduct.eu.flaggedAdditives.map((f, i) => (
                          <span key={i} className="additive-chip-neutral">{f}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="clean-label-pill">Clean Label (Natural Plant Concentrates)</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="factor-cell">
                    <span className="factor-title">Nutritional Rating</span>
                    <span className="factor-sub">Nutri-Score profile</span>
                  </td>
                  <td>
                    <span className={`grade-pill grade-${selectedProduct.india.nutriScore.toLowerCase()}`}>
                      Nutri-Score {selectedProduct.india.nutriScore}
                    </span>
                  </td>
                  <td>
                    <span className={`grade-pill grade-${selectedProduct.eu.nutriScore.toLowerCase()}`}>
                      Nutri-Score {selectedProduct.eu.nutriScore}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Concise Takeaway Box */}
          <div className="takeaway-banner">
            <span className="takeaway-title">Core Regulatory Divergence</span>
            <p className="takeaway-text">
              {selectedProduct.disparityAnalysis.primaryDivergence}. {selectedProduct.disparityAnalysis.healthImplication}
            </p>
          </div>

          {/* Collapsible Policy Deep-Dive */}
          <div className="deep-dive-accordion">
            <button
              type="button"
              className="deep-dive-toggle"
              onClick={() => setShowFullAnalysis(!showFullAnalysis)}
              aria-expanded={showFullAnalysis}
            >
              <span>{showFullAnalysis ? "Hide Statutory Policy Rationale" : "View Statutory Policy Rationale & Ingredient Citations"}</span>
              {showFullAnalysis ? (
                <ChevronUp className="toggle-chevron" />
              ) : (
                <ChevronDown className="toggle-chevron" />
              )}
            </button>

            {showFullAnalysis && (
              <div className="deep-dive-body">
                <div className="deep-dive-item">
                  <span className="deep-dive-label">Regulatory Driver</span>
                  <p>{selectedProduct.disparityAnalysis.regulatoryStandardGap}</p>
                </div>
                <div className="deep-dive-item">
                  <span className="deep-dive-label">India Declared Ingredients</span>
                  <p className="ingredient-code-text">{selectedProduct.india.keyIngredients}</p>
                </div>
                <div className="deep-dive-item">
                  <span className="deep-dive-label">Europe Declared Ingredients</span>
                  <p className="ingredient-code-text">{selectedProduct.eu.keyIngredients}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
