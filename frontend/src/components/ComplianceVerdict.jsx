import { ShieldBan, ShieldAlert, ShieldCheck } from "./Icons";

export default function ComplianceVerdict({ compliance }) {
  if (!compliance) return null;

  const { verdict, offendingAdditives, hasRestrictedAdditives, restrictedAdditives } = compliance;

  const getVerdictConfig = () => {
    switch (verdict) {
      case "NON_COMPLIANT":
        return {
          cardClass: "verdict-banner banner-danger",
          icon: <ShieldBan className="verdict-svg danger" />,
          title: "Prohibited on European Shelves",
          pill: "BANNED IN EU",
          pillClass: "status-pill-danger",
          tagline: "Contains food additives banned across the European Union under Regulation (EU) 2022/63 due to genotoxicity or health hazards.",
        };
      case "RESTRICTED_WARNING_REQUIRED":
        return {
          cardClass: "verdict-banner banner-warning",
          icon: <ShieldAlert className="verdict-svg warning" />,
          title: "Mandatory Child Warning Required in EU",
          pill: "WARNING REQUIRED",
          pillClass: "status-pill-warning",
          tagline: "Contains Southampton azo dyes requiring the statutory label: 'May have an adverse effect on activity and attention in children' under Regulation (EC) 1333/2008 Annex V.",
        };
      case "COMPLIANT":
      default:
        return {
          cardClass: hasRestrictedAdditives
            ? "verdict-banner banner-warning-subtle"
            : "verdict-banner banner-success",
          icon: hasRestrictedAdditives ? (
            <ShieldAlert className="verdict-svg warning" />
          ) : (
            <ShieldCheck className="verdict-svg success" />
          ),
          title: "No EU-Banned Additives Detected",
          pill: "NO BANNED ADDITIVES",
          pillClass: "status-pill-clean",
          tagline:
            "No EU-prohibited additives or mandatory Annex V child-warning dyes were found in the declared text. Note: This rule engine screens declared ingredients only and does not verify laboratory limits such as heavy metals, pesticides, or dosage caps.",
        };
    }
  };

  const config = getVerdictConfig();

  return (
    <div className={config.cardClass}>
      <div className="verdict-top-bar">
        <div className="verdict-icon-container">
          {config.icon}
        </div>
        <div className="verdict-text-block">
          <div className="verdict-heading-line">
            <span className="verdict-title">{config.title}</span>
            <span className={`status-pill ${config.pillClass}`}>{config.pill}</span>
            {hasRestrictedAdditives && verdict === "COMPLIANT" && (
              <span className="caution-tag-pill">Category-Restricted In EU</span>
            )}
          </div>
          <p className="verdict-description">{config.tagline}</p>
        </div>
      </div>

      {/* Flagged Banned or Warning Offender Chips */}
      {offendingAdditives && offendingAdditives.length > 0 && (
        <div className="verdict-footer-chips">
          <span className="chips-title">Triggering Substance{offendingAdditives.length > 1 ? "s" : ""}:</span>
          <div className="chips-list">
            {offendingAdditives.map((item) => (
              <span key={item.id} className="flagged-chip">
                <span className="chip-code">{item.code}</span>
                <span className="chip-name">{item.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Restricted Additives Chips (e.g. TBHQ) */}
      {hasRestrictedAdditives && restrictedAdditives && restrictedAdditives.length > 0 && (
        <div className="verdict-footer-chips">
          <span className="chips-title">Restricted In EU (Dosage Capped):</span>
          <div className="chips-list">
            {restrictedAdditives.map((item) => (
              <span key={item.id} className="flagged-chip chip-restricted">
                <span className="chip-code">{item.code}</span>
                <span className="chip-name">{item.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
