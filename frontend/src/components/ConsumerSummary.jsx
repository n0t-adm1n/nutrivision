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
    <div className="consumer-summary-card">
      <div className="summary-title-row">
        <h3>🔍 At-a-Glance Consumer Breakdown</h3>
        <span className="summary-hint">What this means for you in plain language</span>
      </div>

      <div className="consumer-cards-grid">
        {/* 1. EU Banned Additives */}
        <div className={`consumer-box ${bannedItems.length > 0 ? "alert-red" : "alert-green"}`}>
          <div className="box-header">
            <span className="box-icon">{bannedItems.length > 0 ? "🚫" : "✅"}</span>
            <strong>European Safety Status</strong>
          </div>
          {bannedItems.length > 0 ? (
            <p>
              Contains <strong>{bannedItems.map((b) => b.name).join(", ")}</strong>, which is{" "}
              <span className="highlight-danger">banned in the European Union</span> due to health and safety concerns.
            </p>
          ) : (
            <p>No EU-banned chemical additives detected in this product.</p>
          )}
        </div>

        {/* 2. Child Hyperactivity Warnings */}
        <div className={`consumer-box ${warningDyes.length > 0 ? "alert-amber" : "alert-green"}`}>
          <div className="box-header">
            <span className="box-icon">{warningDyes.length > 0 ? "⚠️" : "✅"}</span>
            <strong>Kids &amp; Artificial Colors</strong>
          </div>
          {warningDyes.length > 0 ? (
            <p>
              Contains <strong>{warningDyes.map((d) => d.name).join(", ")}</strong>. In Europe, labels must warn that this dye{" "}
              <span className="highlight-warn">"may affect activity and attention in children"</span>.
            </p>
          ) : (
            <p>Free of artificial azo colors requiring child hyperactivity warnings.</p>
          )}
        </div>

        {/* 3. Sugar Splitting & Sweeteners */}
        <div className={`consumer-box ${hiddenSugars.sugarSplittingDetected ? "alert-amber" : "alert-neutral"}`}>
          <div className="box-header">
            <span className="box-icon">🍯</span>
            <strong>Sugar &amp; Sweeteners</strong>
          </div>
          {hiddenSugars.sugarSplittingDetected ? (
            <p>
              <strong>Sugar Splitting Detected ({hiddenSugars.detectedCount} types):</strong>{" "}
              Uses multiple sugars (<em>{hiddenSugars.detectedSugars.map((s) => s.canonicalName).join(", ")}</em>) so sugar doesn't look like the top ingredient.
            </p>
          ) : hiddenSugars.detectedCount === 1 ? (
            <p>
              Contains added sweetener: <strong>{hiddenSugars.detectedSugars[0].canonicalName}</strong>.
            </p>
          ) : (
            <p>No added refined sugars or chemical sweeteners detected.</p>
          )}
        </div>

        {/* 4. Vegetarian Dot Alert */}
        <div className={`consumer-box ${vegBlindspots.hasBlindspots ? "alert-amber" : "alert-green"}`}>
          <div className="box-header">
            <span className="box-icon">{vegBlindspots.hasBlindspots ? "🥬⚠️" : "🥬✅"}</span>
            <strong>Vegetarian Transparency</strong>
          </div>
          {vegBlindspots.hasBlindspots ? (
            <p>
              <strong>Watch out:</strong> Contains <strong>{vegBlindspots.blindspots.map((b) => b.name).join(", ")}</strong> (animal/insect origin). Under Indian law, these are legally allowed under the <strong>Green Veg Dot</strong>!
            </p>
          ) : (
            <p>No hidden animal-derived glazes or insect extracts detected.</p>
          )}
        </div>

        {/* 5. Food Processing Tier */}
        <div className={`consumer-box ${novaGroup.group === 4 ? "alert-red" : "alert-green"}`}>
          <div className="box-header">
            <span className="box-icon">{novaGroup.group === 4 ? "🏭" : "🥗"}</span>
            <strong>Food Processing Level</strong>
          </div>
          <p>
            <strong>{novaGroup.group === 4 ? "Ultra-Processed (UPF)" : "Minimally Processed"}</strong>:{" "}
            {novaGroup.group === 4
              ? "Made with industrial additives and fats not found in a home kitchen. Best consumed in moderation."
              : "Made primarily with whole foods or basic kitchen ingredients."}
          </p>
        </div>
      </div>
    </div>
  );
}
