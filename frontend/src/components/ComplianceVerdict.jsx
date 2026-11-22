export default function ComplianceVerdict({ compliance }) {
  if (!compliance) return null;

  const { verdict, title, summary, requiredAction, offendingAdditives } = compliance;

  const getStyleClass = () => {
    switch (verdict) {
      case "NON_COMPLIANT":
        return "verdict-card danger";
      case "RESTRICTED_WARNING_REQUIRED":
        return "verdict-card warning";
      case "COMPLIANT":
      default:
        return "verdict-card success";
    }
  };

  const getIcon = () => {
    switch (verdict) {
      case "NON_COMPLIANT":
        return "🚫";
      case "RESTRICTED_WARNING_REQUIRED":
        return "⚠️";
      case "COMPLIANT":
      default:
        return "✅";
    }
  };

  return (
    <div className={getStyleClass()}>
      <div className="verdict-header">
        <span className="verdict-icon">{getIcon()}</span>
        <div className="verdict-header-text">
          <span className="verdict-tag">EU SHELF COMPLIANCE VERDICT</span>
          <h2 className="verdict-title">{title}</h2>
        </div>
        <span className={`verdict-pill ${verdict.toLowerCase()}`}>
          {verdict.replace(/_/g, " ")}
        </span>
      </div>

      <p className="verdict-summary">{summary}</p>

      {offendingAdditives && offendingAdditives.length > 0 && (
        <div className="verdict-offenders">
          <strong>Flagged Offending Additives:</strong>
          <ul>
            {offendingAdditives.map((item) => (
              <li key={item.id}>
                <span className="offender-code">{item.code}</span> —{" "}
                <span className="offender-name">{item.name}</span>{" "}
                <span className="offender-citation">({item.euCitation})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {requiredAction && (
        <div className="verdict-action">
          <strong>Regulatory Mandate for EU Placement:</strong> {requiredAction}
        </div>
      )}
    </div>
  );
}
