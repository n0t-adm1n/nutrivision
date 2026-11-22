import { useState, useEffect } from "react";
import axios from "axios";

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
    <div className="dual-quality-container">
      {/* Intro Bar */}
      <div className="dq-compact-intro">
        <h2>⚖️ Dual Quality: Same Brand, Different Quality</h2>
        <p>
          Multinational brands often sell products in India made with cheaper palm oil, synthetic chemical dyes, and higher sugar compared to the exact same brand sold in Europe.
        </p>
      </div>

      {loading && <div className="loading-spinner">Loading comparisons...</div>}
      {error && <div className="alert-banner error">{error}</div>}

      {/* Product Selector */}
      {products.length > 0 && (
        <div className="compact-product-selector">
          <span className="selector-title">Select a Product:</span>
          <div className="selector-pills">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`product-pill ${selectedId === p.id ? "active" : ""}`}
                onClick={() => setSelectedId(p.id)}
              >
                {p.productName.split("(")[0].trim()}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="compact-comparison-card">
          <div className="comparison-card-top">
            <div>
              <h3>{selectedProduct.productName}</h3>
              <span className="brand-sub">Brand: {selectedProduct.brand}</span>
            </div>
            {onInspectInScanner && selectedProduct.india.keyIngredients && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onInspectInScanner(selectedProduct.india.keyIngredients)}
              >
                🔍 Test Indian Recipe in Scanner
              </button>
            )}
          </div>

          {/* Quick Comparison Table */}
          <div className="table-responsive">
            <table className="comparison-matrix-table">
              <thead>
                <tr>
                  <th style={{ width: "25%" }}>Comparison Factor</th>
                  <th style={{ width: "37%" }}>🇮🇳 Indian Market Pack</th>
                  <th style={{ width: "38%" }}>🇪🇺 European / UK Pack</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>🛢️ Oil &amp; Fat Quality</strong>
                  </td>
                  <td className="diff-highlight-danger">
                    <strong>{selectedProduct.india.oilBase}</strong>
                    {selectedProduct.india.saturatedFatPer100g && (
                      <span className="sub-stat">Sat Fat: {selectedProduct.india.saturatedFatPer100g}</span>
                    )}
                  </td>
                  <td className="diff-highlight-success">
                    <strong>{selectedProduct.eu.oilBase}</strong>
                    {selectedProduct.eu.saturatedFatPer100g && (
                      <span className="sub-stat">Sat Fat: {selectedProduct.eu.saturatedFatPer100g}</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td>
                    <strong>🍬 Sugar per 100g</strong>
                  </td>
                  <td className="diff-highlight-danger">
                    <strong className="stat-number">{selectedProduct.india.sugarPer100g}g</strong>
                  </td>
                  <td className="diff-highlight-success">
                    <strong className="stat-number">{selectedProduct.eu.sugarPer100g}g</strong>
                  </td>
                </tr>

                <tr>
                  <td>
                    <strong>🎨 Colors &amp; Additives</strong>
                  </td>
                  <td>
                    {selectedProduct.india.flaggedAdditives.length > 0 ? (
                      <div className="additive-badge-list">
                        {selectedProduct.india.flaggedAdditives.map((f, i) => (
                          <span key={i} className="mini-badge-warn">{f}</span>
                        ))}
                      </div>
                    ) : (
                      <span>None</span>
                    )}
                  </td>
                  <td>
                    {selectedProduct.eu.flaggedAdditives.length > 0 ? (
                      <div className="additive-badge-list">
                        {selectedProduct.eu.flaggedAdditives.map((f, i) => (
                          <span key={i} className="mini-badge-clean">{f}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="mini-badge-clean">Clean Formula (Natural Extracts)</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td>
                    <strong>📊 Health Score (Nutri-Score)</strong>
                  </td>
                  <td>
                    <span className={`score-pill score-${selectedProduct.india.nutriScore.toLowerCase()}`}>
                      Grade {selectedProduct.india.nutriScore}
                    </span>
                  </td>
                  <td>
                    <span className={`score-pill score-${selectedProduct.eu.nutriScore.toLowerCase()}`}>
                      Grade {selectedProduct.eu.nutriScore}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quick Bottom Line Summary */}
          <div className="bottom-line-box">
            <span className="bl-label">💡 The Bottom Line:</span>
            <p>
              {selectedProduct.disparityAnalysis.primaryDivergence}. {selectedProduct.disparityAnalysis.healthImplication}
            </p>
          </div>

          {/* Collapsible Detailed Regulatory Breakdown */}
          <div className="detailed-toggle-box">
            <button
              type="button"
              className="toggle-text-btn"
              onClick={() => setShowFullAnalysis(!showFullAnalysis)}
            >
              {showFullAnalysis ? "▲ Hide Detailed Breakdown" : "▼ Read Full Regulatory Policy Explanation"}
            </button>

            {showFullAnalysis && (
              <div className="full-policy-details">
                <div className="policy-block">
                  <strong>Why the difference?</strong>
                  <p>{selectedProduct.disparityAnalysis.regulatoryStandardGap}</p>
                </div>
                <div className="policy-block">
                  <strong>Ingredients Comparison:</strong>
                  <p>
                    <em>India:</em> {selectedProduct.india.keyIngredients}
                  </p>
                  <p>
                    <em>Europe:</em> {selectedProduct.eu.keyIngredients}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
