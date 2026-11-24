import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { ScaleIcon, ChevronDown, ChevronUp, ArrowUpRight } from "./Icons";

const API_BASE = "http://localhost:5000/api";

function renderOilBase(oilBase, flaggedOils = [], isEu = false) {
  if (!oilBase || oilBase.startsWith("N/A")) {
    return <span className="spec-val-neutral">{oilBase}</span>;
  }

  if (isEu) {
    return <span className="spec-val-success">{oilBase}</span>;
  }

  if (!flaggedOils || flaggedOils.length === 0) {
    return <span className="spec-val-neutral">{oilBase}</span>;
  }

  const escaped = flaggedOils.map((o) => o.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = oilBase.split(regex);

  return (
    <span className="spec-val-mixed">
      {parts.map((part, i) => {
        const isFlagged = flaggedOils.some(
          (f) => f.toLowerCase() === part.toLowerCase()
        );
        return isFlagged ? (
          <span key={i} className="spec-val-danger font-semibold">{part}</span>
        ) : (
          <span key={i} className="spec-val-neutral">{part}</span>
        );
      })}
    </span>
  );
}

function getSugarThresholdConfig(sugarValue) {
  const val = typeof sugarValue === "number" ? sugarValue : parseFloat(sugarValue) || 0;
  if (val < 5) {
    return {
      textClass: "sugar-val-low",
      barClass: "sugar-fill-low",
    };
  }
  if (val <= 15) {
    return {
      textClass: "sugar-val-mid",
      barClass: "sugar-fill-mid",
    };
  }
  return {
    textClass: "sugar-val-high",
    barClass: "sugar-fill-high",
  };
}

export default function DualQualityTab({ onInspectInScanner }) {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("lays-classic");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const timer = setTimeout(updateScrollButtons, 50);
    const el = scrollRef.current;
    if (!el) return () => clearTimeout(timer);
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [products, updateScrollButtons]);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const offset = 260 * direction;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

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
            Multinational food brands frequently tailor product formulations across regional markets. This module compares declared fat bases, total and added sugar levels, and additive mandates between FSSAI (India) and EFSA (EU/UK) product formulations.
          </p>
        </div>
      </div>

      {loading && <div className="loading-state">Loading product comparisons...</div>}
      {error && <div className="toast-error">{error}</div>}

      {/* Product Selector Scroll */}
      {products.length > 0 && (
        <div className="product-scroll-container">
          <div className="scroll-header-row">
            <span className="scroll-caption">Select Comparative Case Study:</span>
            <div className="carousel-nav-controls">
              <button
                type="button"
                className="carousel-arrow-btn"
                onClick={() => handleScroll(-1)}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
              >
                ‹
              </button>
              <button
                type="button"
                className="carousel-arrow-btn"
                onClick={() => handleScroll(1)}
                disabled={!canScrollRight}
                aria-label="Scroll right"
              >
                ›
              </button>
            </div>
          </div>
          <div className={`scroll-track-wrapper ${canScrollLeft ? "fade-left" : ""} ${canScrollRight ? "fade-right" : ""}`}>
            <div className="scroll-pills-row" ref={scrollRef}>
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
                  <th style={{ width: "26%" }}>Nutritional &amp; Formulation Factor</th>
                  <th style={{ width: "37%" }}>
                    <div className="jurisdiction-th">
                      <span className="flag-circle">IN</span>
                      <span>India Market Pack (FSSAI)</span>
                    </div>
                  </th>
                  <th style={{ width: "37%" }}>
                    <div className="jurisdiction-th">
                      <span className="flag-circle eu">EU</span>
                      <span>European Union / UK Pack</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Row 1: Fat & Oil Base (Fix 3 & Fix 5) */}
                <tr>
                  <td className="factor-cell">
                    <span className="factor-title">
                      {selectedProduct.fatRowLabel || "Fat & Oil Base"}
                    </span>
                    <span className="factor-sub">
                      {selectedProduct.fatRowSublabel || "Lipid profile & saturated fats"}
                    </span>
                  </td>
                  <td className="diff-cell-body">
                    {renderOilBase(selectedProduct.india.oilBase, selectedProduct.india.flaggedOils, false)}
                    {selectedProduct.india.saturatedFatPer100g && (
                      <span className="sat-fat-note">
                        Saturated Fat: <strong className="val-danger">{selectedProduct.india.saturatedFatPer100g}</strong>
                      </span>
                    )}
                  </td>
                  <td className="diff-cell-body">
                    {renderOilBase(selectedProduct.eu.oilBase, [], true)}
                    {selectedProduct.eu.saturatedFatPer100g && (
                      <span className="sat-fat-note">
                        Saturated Fat: <strong className="val-success">{selectedProduct.eu.saturatedFatPer100g}</strong>
                      </span>
                    )}
                  </td>
                </tr>

                {/* Row 2: Total Sugars (per 100g) (Fix 4: Dynamic Threshold Coloring) */}
                <tr>
                  <td className="factor-cell">
                    <span className="factor-title">Total Sugars (per 100g)</span>
                    <span className="factor-sub">Refined vs. naturally occurring</span>
                  </td>
                  <td className="diff-cell-body">
                    {(() => {
                      const cfg = getSugarThresholdConfig(selectedProduct.india.sugarPer100g);
                      return (
                        <div className="sugar-stat-box">
                          <div className="sugar-val-line">
                            <span className={`sugar-number ${cfg.textClass}`}>{selectedProduct.india.sugarPer100g}g</span>
                          </div>
                          <div className="sugar-progress-track">
                            <div
                              className={cfg.barClass}
                              style={{
                                width: `${Math.min(100, (selectedProduct.india.sugarPer100g / 60) * 100)}%`,
                              }}
                            />
                          </div>
                          {selectedProduct.india.indiaSugarNote && (
                            <span className="sugar-detail-note">{selectedProduct.india.indiaSugarNote}</span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="diff-cell-body">
                    {(() => {
                      const cfg = getSugarThresholdConfig(selectedProduct.eu.sugarPer100g);
                      return (
                        <div className="sugar-stat-box">
                          <div className="sugar-val-line">
                            <span className={`sugar-number ${cfg.textClass}`}>{selectedProduct.eu.sugarPer100g}g</span>
                          </div>
                          <div className="sugar-progress-track">
                            <div
                              className={cfg.barClass}
                              style={{
                                width: `${Math.min(100, (selectedProduct.eu.sugarPer100g / 60) * 100)}%`,
                              }}
                            />
                          </div>
                          {selectedProduct.eu.euSugarNote && (
                            <span className="sugar-detail-note">{selectedProduct.eu.euSugarNote}</span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                </tr>

                {/* Row 3: Additives, Flavours & Sweeteners (Fix 3) */}
                <tr>
                  <td className="factor-cell">
                    <span className="factor-title">Additives, Flavours &amp; Sweeteners</span>
                    <span className="factor-sub">Dyes, flavourings, emulsifiers &amp; added sugars</span>
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
                    {selectedProduct.eu.flaggedAdditives && selectedProduct.eu.flaggedAdditives.length > 0 ? (
                      <div className="badges-flex">
                        {selectedProduct.eu.flaggedAdditives.map((f, i) => (
                          <span key={i} className="additive-chip-neutral">{f}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="clean-label-pill">
                        {selectedProduct.eu.cleanLabelText || "No Artificial Additives or Preservatives"}
                      </span>
                    )}
                  </td>
                </tr>

                {/* Row 4: Nutri-Score Profile */}
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
