import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  LeafIcon,
  FactoryIcon,
  CheckCircle2,
} from "./Icons";

export default function ConsumerSummary({ analysis }) {
  if (!analysis) return null;

  const { flaggedAdditives, hiddenSugars, vegBlindspots, novaGroup } = analysis;

  const bannedItems = flaggedAdditives.filter(
    (a) => a.euStatus === "BANNED" || a.classification === "EU_BANNED"
  );
  const warningDyes = flaggedAdditives.filter(
    (a) => a.classification === "ANNEX_V_DYE" && a.euWarningRequired
  );

  return (
    <div className="summary-section">
      <div className="section-header-row">
        <div>
          <h3 className="section-title">Consumer Health &amp; Regulatory Audit</h3>
          <p className="section-caption">Plain-language assessment of product formulation</p>
        </div>
      </div>

      <div className="bento-grid">
        {/* 1. EU Safety Status */}
        <div className={`bento-card ${bannedItems.length > 0 ? "card-alert-red" : "card-alert-emerald"}`}>
          <div className="bento-card-header">
            <div className="bento-icon-wrapper">
              {bannedItems.length > 0 ? (
                <ShieldAlert className="bento-icon red" />
              ) : (
                <ShieldCheck className="bento-icon emerald" />
              )}
            </div>
            <span className="bento-category">EU Market Authorization</span>
            <span className={`bento-status-tag ${bannedItems.length > 0 ? "tag-red" : "tag-emerald"}`}>
              {bannedItems.length > 0 ? "Banned in EU" : "EU Approved"}
            </span>
          </div>
          <div className="bento-body">
            {bannedItems.length > 0 ? (
              <p>
                Contains <strong>{bannedItems.map((b) => b.name).join(", ")}</strong>. Prohibited in European food products under Regulation (EU) 2022/63 due to genotoxicity or health risks.
              </p>
            ) : (
              <p>No EU-banned food additives or prohibited whitening pigments were detected in this formula.</p>
            )}
          </div>
        </div>

        {/* 2. Child Hyperactivity Warnings */}
        <div className={`bento-card ${warningDyes.length > 0 ? "card-alert-amber" : "card-alert-emerald"}`}>
          <div className="bento-card-header">
            <div className="bento-icon-wrapper">
              {warningDyes.length > 0 ? (
                <AlertTriangle className="bento-icon amber" />
              ) : (
                <CheckCircle2 className="bento-icon emerald" />
              )}
            </div>
            <span className="bento-category">Child Attention &amp; Hyperactivity</span>
            <span className={`bento-status-tag ${warningDyes.length > 0 ? "tag-amber" : "tag-emerald"}`}>
              {warningDyes.length > 0 ? "Warning Required" : "No Warning Dyes"}
            </span>
          </div>
          <div className="bento-body">
            {warningDyes.length > 0 ? (
              <p>
                Contains Southampton azo dye <strong>{warningDyes.map((d) => d.name).join(", ")}</strong>. In Europe, labels must state: <em>"May have an adverse effect on activity and attention in children."</em>
              </p>
            ) : (
              <p>Free of artificial azo colorants that trigger European child behavioral warning mandates.</p>
            )}
          </div>
        </div>

        {/* 3. Sugar Splitting & Sweeteners */}
        <div className={`bento-card ${hiddenSugars.sugarSplittingDetected ? "card-alert-amber" : "card-neutral"}`}>
          <div className="bento-card-header">
            <div className="bento-icon-wrapper">
              <span className="custom-icon">🍬</span>
            </div>
            <span className="bento-category">Sugar Engineering &amp; Sweeteners</span>
            <span className={`bento-status-tag ${hiddenSugars.sugarSplittingDetected ? "tag-amber" : "tag-neutral"}`}>
              {hiddenSugars.sugarSplittingDetected ? "Sugar Splitting" : `${hiddenSugars.detectedCount} Sugar Source${hiddenSugars.detectedCount === 1 ? "" : "s"}`}
            </span>
          </div>
          <div className="bento-body">
            {hiddenSugars.sugarSplittingDetected ? (
              <p>
                <strong>Sugar Splitting Detected ({hiddenSugars.detectedCount} types):</strong> Uses multiple sugars (<em>{hiddenSugars.detectedSugars.map((s) => s.canonicalName).join(", ")}</em>) so sugar does not appear as the #1 ingredient.
              </p>
            ) : hiddenSugars.detectedCount === 1 ? (
              <p>
                Contains <strong>{hiddenSugars.detectedSugars[0].canonicalName}</strong> as a primary sweetening ingredient.
              </p>
            ) : (
              <p>No added refined sugars or chemical caloric sweeteners detected in the ingredient statement.</p>
            )}
          </div>
        </div>

        {/* 4. Vegetarian Dot Alert */}
        <div className={`bento-card ${vegBlindspots.hasBlindspots ? "card-alert-amber" : "card-alert-emerald"}`}>
          <div className="bento-card-header">
            <div className="bento-icon-wrapper">
              <LeafIcon className={`bento-icon ${vegBlindspots.hasBlindspots ? "amber" : "emerald"}`} />
            </div>
            <span className="bento-category">Vegetarian Dot Transparency</span>
            <span className={`bento-status-tag ${vegBlindspots.hasBlindspots ? "tag-amber" : "tag-emerald"}`}>
              {vegBlindspots.hasBlindspots ? "Blindspot Alert" : "Veg Safe"}
            </span>
          </div>
          <div className="bento-body">
            {vegBlindspots.hasBlindspots ? (
              <p>
                <strong>Animal/Insect Origin:</strong> Contains <strong>{vegBlindspots.blindspots.map((b) => b.name).join(", ")}</strong>. Under FSSAI labelling rules, insect/animal glazes are legally exempt from triggering the brown non-veg dot.
              </p>
            ) : (
              <p>No animal-derived glazing agents, insect red pigments, or hidden keratin conditioners found.</p>
            )}
          </div>
        </div>

        {/* 5. Food Processing Tier (Span Full Width) */}
        <div className={`bento-card full-width ${novaGroup.group === 4 ? "card-alert-red" : "card-alert-emerald"}`}>
          <div className="bento-card-header">
            <div className="bento-icon-wrapper">
              <FactoryIcon className={`bento-icon ${novaGroup.group === 4 ? "red" : "emerald"}`} />
            </div>
            <span className="bento-category">NOVA Industrial Processing Tier</span>
            <span className={`bento-status-tag ${novaGroup.group === 4 ? "tag-red" : "tag-emerald"}`}>
              NOVA Group {novaGroup.group} · {novaGroup.group === 4 ? "Ultra-Processed" : "Whole / Culinary"}
            </span>
          </div>
          <div className="bento-body">
            <p>
              {novaGroup.group === 4 ? (
                <>
                  <strong>Ultra-Processed Food (UPF):</strong> Industrial formulation engineered with cosmetic additives, intense emulsifiers, or fractionated oils not typically found in a home kitchen.
                </>
              ) : (
                <>
                  <strong>Minimally Processed Food:</strong> Made primarily with whole agricultural ingredients and simple culinary additions.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
