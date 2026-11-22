import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export default function DualQualityTab({ onInspectInScanner }) {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("lays-classic");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        console.warn("Could not fetch comparisons from backend:", err.message);
        setError("Unable to connect to backend for live comparisons. Is the server running?");
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedId);

  return (
    <div className="dual-quality-container">
      {/* Intro Banner */}
      <div className="card dq-intro-card">
        <div className="dq-intro-content">
          <span className="dq-icon">⚖️</span>
          <div>
            <h2>Dual-Quality Standards: India vs. European Union</h2>
            <p>
              "Dual quality" refers to the practice where multinational food corporations sell products under identical global brand names and packaging, but formulate them with cheaper, more saturated fats, higher refined sugars, and synthetic dyes in developing markets like India compared to European shelves.
            </p>
          </div>
        </div>
      </div>

      {loading && <div className="loading-spinner">Loading product comparisons...</div>}
      {error && <div className="alert-banner error">{error}</div>}

      {/* Product Selector Bar */}
      {products.length > 0 && (
        <div className="product-selector-bar">
          <label htmlFor="product-select" className="selector-label">
            Select Global Product to Compare:
          </label>
          <div className="selector-grid">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`product-pill-btn ${selectedId === p.id ? "active" : ""}`}
                onClick={() => setSelectedId(p.id)}
              >
                <span className="pill-brand">{p.brand}</span>
                <span className="pill-name">{p.productName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Product Comparison View */}
      {selectedProduct && (
        <div className="comparison-view">
          <div className="product-banner">
            <div>
              <span className="product-category">{selectedProduct.category}</span>
              <h3 className="product-title">{selectedProduct.productName}</h3>
              <span className="product-brand-tag">Manufacturer: {selectedProduct.brand}</span>
            </div>
            {onInspectInScanner && selectedProduct.india.keyIngredients && (
              <button
                type="button"
                className="btn btn-secondary inspect-btn"
                onClick={() =>
                  onInspectInScanner(selectedProduct.india.keyIngredients)
                }
              >
                🔍 Analyze Indian Recipe in Scanner
              </button>
            )}
          </div>

          {/* Side-by-Side Dual Quality Diff Cards */}
          <div className="diff-grid">
            {/* India Formulation Card */}
            <div className="diff-card india-card">
              <div className="diff-card-header">
                <span className="flag-icon">🇮🇳</span>
                <div>
                  <h4>{selectedProduct.india.marketName}</h4>
                  <span className="market-tag">FSSAI Regulatory Jurisdiction</span>
                </div>
              </div>

              <div className="diff-metrics">
                <div className="diff-metric-row">
                  <span className="metric-label">Primary Frying / Fat Base</span>
                  <strong className="metric-val danger">
                    {selectedProduct.india.oilBase}
                  </strong>
                </div>

                <div className="diff-metric-row">
                  <span className="metric-label">Sugar per 100g</span>
                  <strong className="metric-val">
                    {selectedProduct.india.sugarPer100g}g
                  </strong>
                  <div className="sugar-bar-track">
                    <div
                      className="sugar-bar-fill india"
                      style={{
                        width: `${Math.min(100, (selectedProduct.india.sugarPer100g / 60) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {selectedProduct.india.saturatedFatPer100g && (
                  <div className="diff-metric-row">
                    <span className="metric-label">Saturated Fat per 100g</span>
                    <strong className="metric-val danger">
                      {selectedProduct.india.saturatedFatPer100g}
                    </strong>
                  </div>
                )}

                <div className="diff-metric-row">
                  <span className="metric-label">Nutri-Score &amp; NOVA</span>
                  <div className="badges-group">
                    <span className="badge-score score-e">
                      Nutri-Score {selectedProduct.india.nutriScore}
                    </span>
                    <span className="badge-score nova-4">
                      NOVA {selectedProduct.india.novaGroup}
                    </span>
                  </div>
                </div>

                <div className="diff-metric-row">
                  <span className="metric-label">Flagged Additives / Dyes</span>
                  <div className="flagged-tags">
                    {selectedProduct.india.flaggedAdditives.map((flag, idx) => (
                      <span key={idx} className="flag-tag danger">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ingredients-box">
                <strong>Pack Ingredient List:</strong>
                <p>{selectedProduct.india.keyIngredients}</p>
              </div>

              <div className="notes-box">
                <strong>Market Reality:</strong>
                <p>{selectedProduct.india.regulatoryNotes}</p>
              </div>
            </div>

            {/* EU / UK Formulation Card */}
            <div className="diff-card eu-card">
              <div className="diff-card-header">
                <span className="flag-icon">🇪🇺 / 🇬🇧</span>
                <div>
                  <h4>{selectedProduct.eu.marketName}</h4>
                  <span className="market-tag">EFSA &amp; UK FSA Regulatory Jurisdiction</span>
                </div>
              </div>

              <div className="diff-metrics">
                <div className="diff-metric-row">
                  <span className="metric-label">Primary Frying / Fat Base</span>
                  <strong className="metric-val success">
                    {selectedProduct.eu.oilBase}
                  </strong>
                </div>

                <div className="diff-metric-row">
                  <span className="metric-label">Sugar per 100g</span>
                  <strong className="metric-val">
                    {selectedProduct.eu.sugarPer100g}g
                  </strong>
                  <div className="sugar-bar-track">
                    <div
                      className="sugar-bar-fill eu"
                      style={{
                        width: `${Math.min(100, (selectedProduct.eu.sugarPer100g / 60) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {selectedProduct.eu.saturatedFatPer100g && (
                  <div className="diff-metric-row">
                    <span className="metric-label">Saturated Fat per 100g</span>
                    <strong className="metric-val success">
                      {selectedProduct.eu.saturatedFatPer100g}
                    </strong>
                  </div>
                )}

                <div className="diff-metric-row">
                  <span className="metric-label">Nutri-Score &amp; NOVA</span>
                  <div className="badges-group">
                    <span
                      className={`badge-score score-${selectedProduct.eu.nutriScore.toLowerCase()}`}
                    >
                      Nutri-Score {selectedProduct.eu.nutriScore}
                    </span>
                    <span className="badge-score nova-3">
                      NOVA {selectedProduct.eu.novaGroup}
                    </span>
                  </div>
                </div>

                <div className="diff-metric-row">
                  <span className="metric-label">Flagged Additives / Dyes</span>
                  <div className="flagged-tags">
                    {selectedProduct.eu.flaggedAdditives.length > 0 ? (
                      selectedProduct.eu.flaggedAdditives.map((flag, idx) => (
                        <span key={idx} className="flag-tag warning">
                          {flag}
                        </span>
                      ))
                    ) : (
                      <span className="flag-tag clean">
                        Clean Label (No Annex V dyes or banned additives)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="ingredients-box">
                <strong>Pack Ingredient List:</strong>
                <p>{selectedProduct.eu.keyIngredients}</p>
              </div>

              <div className="notes-box">
                <strong>European Standard:</strong>
                <p>{selectedProduct.eu.regulatoryNotes}</p>
              </div>
            </div>
          </div>

          {/* Disparity & Public Health Analysis Card */}
          <div className="card disparity-card">
            <div className="card-header-bar">
              <span className="card-icon">🔬</span>
              <div>
                <h4>Regulatory &amp; Health Disparity Analysis</h4>
                <p className="card-desc">
                  Key reasons why this formulation differs across borders
                </p>
              </div>
            </div>

            <div className="disparity-grid">
              <div className="disparity-item">
                <span className="item-title">1. Primary Divergence Factor</span>
                <p>{selectedProduct.disparityAnalysis.primaryDivergence}</p>
              </div>

              <div className="disparity-item">
                <span className="item-title">2. Sugar Content Discrepancy</span>
                <p>{selectedProduct.disparityAnalysis.sugarDifference}</p>
              </div>

              <div className="disparity-item">
                <span className="item-title">3. Additives &amp; Colorants Gap</span>
                <p>{selectedProduct.disparityAnalysis.additiveDiscrepancy}</p>
              </div>

              <div className="disparity-item">
                <span className="item-title">4. Regulatory Standard Driver</span>
                <p>{selectedProduct.disparityAnalysis.regulatoryStandardGap}</p>
              </div>

              <div className="disparity-item full-width">
                <span className="item-title danger">5. Public Health Implication for Indian Consumers</span>
                <p>{selectedProduct.disparityAnalysis.healthImplication}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
