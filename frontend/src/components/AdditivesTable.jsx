import { useState } from "react";

export default function AdditivesTable({ additives }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!additives || additives.length === 0) {
    return null;
  }

  const getStatusBadge = (status) => {
    const s = String(status || "").toUpperCase();
    if (s.includes("BANNED") || s.includes("PROHIBITED") || s.includes("UNAPPROVED")) {
      return <span className="status-badge banned">{status}</span>;
    }
    if (s.includes("RESTRICTED") || s.includes("WARNING") || s.includes("LIMITED")) {
      return <span className="status-badge restricted">{status}</span>;
    }
    if (s.includes("VEG_EXEMPT")) {
      return <span className="status-badge blindspot">VEG EXEMPT</span>;
    }
    return <span className="status-badge permitted">{status}</span>;
  };

  const getRiskBadge = (risk) => {
    const r = String(risk || "").toUpperCase();
    if (r === "HIGH") return <span className="risk-badge high">HIGH RISK</span>;
    if (r === "MODERATE") return <span className="risk-badge moderate">MODERATE</span>;
    if (r === "ETHICAL_CONCERN") return <span className="risk-badge ethical">ETHICAL / VEG</span>;
    return <span className="risk-badge low">LOW</span>;
  };

  return (
    <div className="technical-section-wrapper">
      <div className="technical-toggle-bar">
        <div>
          <h4>🔬 Advanced: Complete Regulatory &amp; Legal Citations</h4>
          <p className="toggle-subtext">
            Compare binding statutory citations across India (FSSAI), European Union (EFSA), and US (FDA).
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary toggle-btn"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "▲ Hide Legal Citations" : `▼ Show Legal Table (${additives.length} Additive${additives.length > 1 ? "s" : ""})`}
        </button>
      </div>

      {showDetails && (
        <div className="additives-table-wrapper">
          <div className="table-responsive">
            <table className="regulatory-table">
              <thead>
                <tr>
                  <th style={{ width: "24%" }}>Additive / Code</th>
                  <th style={{ width: "12%" }}>Risk Tier</th>
                  <th style={{ width: "22%" }}>🇮🇳 India (FSSAI)</th>
                  <th style={{ width: "22%" }}>🇪🇺 Europe (EFSA)</th>
                  <th style={{ width: "20%" }}>🇺🇸 US (FDA)</th>
                </tr>
              </thead>
              <tbody>
                {additives.map((item) => (
                  <tr key={item.id} className="rule-row">
                    <td>
                      <div className="additive-name-group">
                        <strong className="additive-name">{item.name}</strong>
                        <span className="additive-code">{item.code}</span>
                        <span className="additive-category">{item.category}</span>
                      </div>
                    </td>

                    <td>{getRiskBadge(item.riskLevel)}</td>

                    <td className="jurisdiction-cell">
                      {getStatusBadge(item.fssaiStatus)}
                      <p className="cell-details">{item.fssaiDetails}</p>
                      {item.fssaiCitation && (
                        <span className="citation-tag">⚖️ {item.fssaiCitation}</span>
                      )}
                    </td>

                    <td className="jurisdiction-cell highlight-eu">
                      {getStatusBadge(item.euStatus)}
                      <p className="cell-details">{item.euDetails}</p>
                      {item.euCitation && (
                        <span className="citation-tag">⚖️ {item.euCitation}</span>
                      )}
                    </td>

                    <td className="jurisdiction-cell">
                      {getStatusBadge(item.fdaStatus)}
                      <p className="cell-details">{item.fdaDetails}</p>
                      {item.fdaCitation && (
                        <span className="citation-tag">⚖️ {item.fdaCitation}</span>
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
