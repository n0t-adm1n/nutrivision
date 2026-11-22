export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="app-header">
      <div className="header-top">
        <div className="logo-group">
          <div className="logo-badge">NV</div>
          <div>
            <h1>NutriVision</h1>
            <p className="subtitle">
              Food Label Safety &amp; Dual-Quality Analyzer (India vs. EU)
            </p>
          </div>
        </div>
        <div className="jurisdiction-pill">
          <span>🇮🇳 India vs 🇪🇺 Europe</span>
        </div>
      </div>

      <nav className="tab-nav" aria-label="Main Navigation">
        <button
          type="button"
          className={`tab-btn ${activeTab === "scanner" ? "active" : ""}`}
          onClick={() => setActiveTab("scanner")}
        >
          <span className="tab-icon">🔍</span>
          <span className="tab-title">Scan Food Label</span>
          <span className="tab-desc">Instant EU compliance, hidden sugars &amp; additives</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "dualQuality" ? "active" : ""}`}
          onClick={() => setActiveTab("dualQuality")}
        >
          <span className="tab-icon">⚖️</span>
          <span className="tab-title">India vs. EU Brand Diff</span>
          <span className="tab-desc">Side-by-side comparison of 10 popular global foods</span>
        </button>
      </nav>
    </header>
  );
}
