export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="app-header">
      <div className="header-top">
        <div className="logo-group">
          <div className="logo-badge">NV</div>
          <div>
            <h1>NutriVision</h1>
            <p className="subtitle">
              Food Label Regulatory &amp; Dual-Quality Analyzer (India vs. EU)
            </p>
          </div>
        </div>
        <div className="jurisdiction-pill">
          <span className="flag">🇮🇳 FSSAI</span>
          <span className="divider">vs</span>
          <span className="flag">🇪🇺 EFSA</span>
          <span className="divider">vs</span>
          <span className="flag">🇺🇸 FDA</span>
        </div>
      </div>

      <nav className="tab-nav" aria-label="Main Navigation">
        <button
          type="button"
          className={`tab-btn ${activeTab === "scanner" ? "active" : ""}`}
          onClick={() => setActiveTab("scanner")}
        >
          <span className="tab-icon">🔍</span>
          <span className="tab-title">Label &amp; Barcode Scanner</span>
          <span className="tab-desc">OCR, Additives, Hidden Sugars &amp; EU Verdict</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === "dualQuality" ? "active" : ""}`}
          onClick={() => setActiveTab("dualQuality")}
        >
          <span className="tab-icon">⚖️</span>
          <span className="tab-title">India vs. EU Dual-Quality</span>
          <span className="tab-desc">10 Global Brands Side-by-Side Formulation Diff</span>
        </button>
      </nav>
    </header>
  );
}
