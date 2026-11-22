export default function AdditivesTable({ additives }) {
  if (!additives || additives.length === 0) {
    return (
      <div className="empty-additives-card">
        <span className="empty-icon">🌱</span>
        <h3>No Regulated Additives Flagged</h3>
        <p>
          No EU-banned additives, Southampton dyes, animal glazing blindspots, or high-risk chemical markers were detected in this ingredient list.
        </p>
      </div>
    );
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
      return <span className="status-badge blindspot">VEG-DOT EXEMPT</span>;
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
    <div className="additives-table-wrapper">
      <div className="section-title-bar">
        <div>
          <h3>Detected Additives &amp; Cross-Jurisdiction Regulatory Comparison</h3>
          <p className="section-subtitle">
            Comparing legally binding status and statutory limits across India (FSSAI), European Union (EFSA), and United States (FDA).
          </p>
        </div>
        <span className="count-badge">{additives.length} Additive{additives.length > 1 ? "s" : ""}</span>
      </div>

      <div className="table-responsive">
        <table className="regulatory-table">
          <thead>
            <tr>
              <th style={{ width: "22%" }}>Additive / INS Code</th>
              <th style={{ width: "12%" }}>Risk Tier</th>
              <th style={{ width: "22%" }}>🇮🇳 FSSAI (India)</th>
              <th style={{ width: "22%" }}>🇪🇺 EU (EFSA)</th>
              <th style={{ width: "22%" }}>🇺🇸 US (FDA)</th>
            </tr>
          </thead>
          <tbody>
            {additives.map((item) => (
              <tr key={item.id} className={`rule-row ${item.classification.toLowerCase()}`}>
                <td className="additive-meta-cell">
                  <div className="additive-name-group">
                    <strong className="additive-name">{item.name}</strong>
                    <span className="additive-code">{item.code}</span>
                    <span className="additive-category">{item.category}</span>
                    {item.matchedSnippet && (
                      <span className="matched-snippet">
                        Matched snippet: <code>{item.matchedSnippet}</code>
                      </span>
                    )}
                  </div>
                </td>

                <td className="risk-cell">
                  {getRiskBadge(item.riskLevel)}
                </td>

                <td className="jurisdiction-cell">
                  <div className="jurisdiction-content">
                    {getStatusBadge(item.fssaiStatus)}
                    <p className="cell-details">{item.fssaiDetails}</p>
                    {item.fssaiCitation && (
                      <span className="citation-tag">⚖️ {item.fssaiCitation}</span>
                    )}
                  </div>
                </td>

                <td className="jurisdiction-cell highlight-eu">
                  <div className="jurisdiction-content">
                    {getStatusBadge(item.euStatus)}
                    <p className="cell-details">{item.euDetails}</p>
                    {item.euCitation && (
                      <span className="citation-tag">⚖️ {item.euCitation}</span>
                    )}
                  </div>
                </td>

                <td className="jurisdiction-cell">
                  <div className="jurisdiction-content">
                    {getStatusBadge(item.fdaStatus)}
                    <p className="cell-details">{item.fdaDetails}</p>
                    {item.fdaCitation && (
                      <span className="citation-tag">⚖️ {item.fdaCitation}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
