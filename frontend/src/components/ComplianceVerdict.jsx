import { ShieldBan, ShieldAlert, ShieldCheck } from "./Icons";

export default function ComplianceVerdict({ compliance }) {
  if (!compliance) return null;

  const { verdict, offendingAdditives } = compliance;

  const getVerdictConfig = () => {
    switch (verdict) {
      case "NON_COMPLIANT":
        return {
          cardClass: "verdict-banner banner-danger",
          icon: <ShieldBan className="verdict-svg danger" />,
          title: "Prohibited on European Shelves",
          pill: "EU Non-Compliant",
          pillClass: "status-pill-danger",
          tagline: "Contains food additives banned across the European Union under Regulation (EU) 2022/63 due to genotoxicity or health hazards.",
        };
      case "RESTRICTED_WARNING_REQUIRED":
        return {
          cardClass: "verdict-banner banner-warning",
          icon: <ShieldAlert className="verdict-svg warning" />,
          title: "Mandatory Child Warning Required in EU",
          pill: "Warning Mandated",
          pillClass: "status-pill-warning",
          tagline: "Contains Southampton azo dyes requiring the statutory label: 'May have an adverse effect on activity and attention in children' under Regulation (EC) 1333/2008 Annex V.",
        };
      case "COMPLIANT":
      default:
        return {
          cardClass: "verdict-banner banner-success",
          icon: <ShieldCheck className="verdict-svg success" />,
          title: "Meets European Union Safety Standards",
          pill: "EU Compliant",
          pillClass: "status-pill-success",
          tagline: "No EU-banned additives or restricted synthetic colorants requiring child hyperactivity warnings were detected.",
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
          </div>
          <p className="verdict-description">{config.tagline}</p>
        </div>
      </div>

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
    </div>
  );
}
