import { useState } from "react";
import { ChevronDown, ChevronUp, ScaleIcon } from "./Icons";

export default function AdditivesTable({ additives }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!additives || additives.length === 0) {
    return null;
  }

  const getStatusBadge = (status) => {
    const s = String(status || "").toUpperCase();
    if (s.includes("BANNED") || s.includes("PROHIBITED") || s.includes("UNAPPROVED")) {
      return <span className="reg-badge badge-banned">{status}</span>;
    }
    if (s.includes("RESTRICTED") || s.includes("WARNING") || s.includes("LIMITED")) {
      return <span className="reg-badge badge-restricted">{status}</span>;
    }
    if (s.includes("VEG_EXEMPT")) {
      return <span className="reg-badge badge-blindspot">VEG EXEMPT</span>;
    }
    return <span className="reg-badge badge-permitted">{status}</span>;
  };

  const getRiskBadge = (risk) => {
    const r = String(risk || "").toUpperCase();
    if (r === "HIGH") return <span className="risk-pill pill-high">High Risk</span>;
    if (r === "MODERATE") return <span className="risk-pill pill-mod">Moderate</span>;
    if (r === "ETHICAL_CONCERN") return <span className="risk-pill pill-ethical">Ethical</span>;
    return <span className="risk-pill pill-low">Low</span>;
  };

  return (
    <div className="accordion-wrapper">
      <button
        type="button"
        className="accordion-header-btn"
        onClick={() => setShowDetails(!showDetails)}
        aria-expanded={showDetails}
      >
        <div className="accordion-label-group">
          <ScaleIcon className="accordion-icon" />
          <div className="accordion-text">
            <span className="accordion-title">Statutory Regulatory Citations &amp; Legal Framework</span>
            <span className="accordion-desc">
              Cross-jurisdiction comparison: India (FSSAI) vs. European Union (EFSA) vs. United States (FDA)
            </span>
          </div>
        </div>

        <div className="accordion-action">
          <span className="badge-count-pill">{additives.length} Flagged</span>
          {showDetails ? (
            <ChevronUp className="chevron-icon" />
          ) : (
            <ChevronDown className="chevron-icon" />
          )}
        </div>
      </button>

      {showDetails && (
        <div className="accordion-content">
          <div className="table-container">
            <table className="reg-matrix-table">
              <thead>
                <tr>
                  <th style={{ width: "24%" }}>Additive &amp; Classification</th>
                  <th style={{ width: "12%" }}>Risk Tier</th>
                  <th style={{ width: "22%" }}>🇮🇳 FSSAI (India)</th>
                  <th style={{ width: "22%" }}>🇪🇺 EFSA (European Union)</th>
                  <th style={{ width: "20%" }}>🇺🇸 US FDA</th>
                </tr>
              </thead>
              <tbody>
                {additives.map((item) => (
                  <tr key={item.id} className="matrix-row">
                    <td className="matrix-cell-primary">
                      <div className="additive-meta">
                        <span className="additive-primary-name">{item.name}</span>
                        <span className="additive-code-tag">{item.code}</span>
                        <span className="additive-category-tag">{item.category}</span>
                      </div>
                    </td>

                    <td>{getRiskBadge(item.riskLevel)}</td>

                    <td className="matrix-cell-body">
                      {getStatusBadge(item.fssaiStatus)}
                      <p className="reg-text">{item.fssaiDetails}</p>
                      {item.fssaiCitation && (
                        <span className="citation-code">Ref: {item.fssaiCitation}</span>
                      )}
                    </td>

                    <td className="matrix-cell-body cell-highlight">
                      {getStatusBadge(item.euStatus)}
                      <p className="reg-text">{item.euDetails}</p>
                      {item.euCitation && (
                        <span className="citation-code">Ref: {item.euCitation}</span>
                      )}
                    </td>

                    <td className="matrix-cell-body">
                      {getStatusBadge(item.fdaStatus)}
                      <p className="reg-text">{item.fdaDetails}</p>
                      {item.fdaCitation && (
                        <span className="citation-code">Ref: {item.fdaCitation}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
