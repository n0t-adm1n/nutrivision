import { ScanIcon, ScaleIcon } from "./Icons";

export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="app-header">
      <div className="navbar-container">
        <div className="brand-lockup">
          <div className="brand-logo">
            <span className="logo-letter">N</span>
            <span className="logo-dot"></span>
          </div>
          <div className="brand-text">
            <div className="brand-heading-row">
              <span className="brand-name">NutriVision</span>
              <span className="brand-tag">OCR + RULE ENGINE</span>
            </div>
            <p className="brand-sub">Food Label Regulatory &amp; Dual-Quality Analyzer</p>
          </div>
        </div>

        <div className="nav-badges">
          <div className="jurisdiction-chip">
            <span className="chip-indicator"></span>
            <span>FSSAI (IN) · EFSA (EU) · FDA (US)</span>
          </div>
        </div>
      </div>

      <nav className="segmented-control" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "scanner"}
          className={`segment-btn ${activeTab === "scanner" ? "active" : ""}`}
          onClick={() => setActiveTab("scanner")}
        >
          <ScanIcon className="segment-icon" />
          <span className="segment-text">Label &amp; Barcode Scanner</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "dualQuality"}
          className={`segment-btn ${activeTab === "dualQuality" ? "active" : ""}`}
          onClick={() => setActiveTab("dualQuality")}
        >
          <ScaleIcon className="segment-icon" />
          <span className="segment-text">India vs. EU Dual Quality</span>
          <span className="badge-count">10 Brands</span>
        </button>
      </nav>
    </header>
  );
}
