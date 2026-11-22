export default function ComplianceVerdict({ compliance }) {
  if (!compliance) return null;

  const { verdict, offendingAdditives } = compliance;

  const getDetails = () => {
    switch (verdict) {
      case "NON_COMPLIANT":
        return {
          cssClass: "verdict-card danger",
          icon: "🚫",
          title: "BANNED ON EUROPEAN SHELVES",
          tagline: "This product contains ingredients strictly prohibited in food across the European Union.",
          pill: "BANNED IN EU",
        };
      case "RESTRICTED_WARNING_REQUIRED":
        return {
          cssClass: "verdict-card warning",
          icon: "⚠️",
          title: "REQUIRES CHILD WARNING IN EUROPE",
          tagline: "Contains artificial dyes requiring a statutory child hyperactivity warning on European labels.",
          pill: "WARNING REQUIRED",
        };
      case "COMPLIANT":
      default:
        return {
          cssClass: "verdict-card success",
          icon: "✅",
          title: "MEETS EUROPEAN SAFETY STANDARDS",
          tagline: "No EU-banned additives or restricted synthetic colorants were detected.",
          pill: "EU COMPLIANT",
        };
    }
  };

  const info = getDetails();

  return (
    <div className={info.cssClass}>
      <div className="verdict-main">
        <span className="verdict-icon">{info.icon}</span>
        <div className="verdict-text">
          <div className="verdict-title-row">
            <h2>{info.title}</h2>
            <span className={`verdict-pill ${verdict.toLowerCase()}`}>{info.pill}</span>
          </div>
          <p className="verdict-tagline">{info.tagline}</p>
        </div>
      </div>

      {offendingAdditives && offendingAdditives.length > 0 && (
        <div className="verdict-chips">
          <span className="chips-label">Flagged Substance{offendingAdditives.length > 1 ? "s" : ""}:</span>
          {offendingAdditives.map((item) => (
            <span key={item.id} className="offender-chip">
              <strong>{item.name}</strong> ({item.code})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
