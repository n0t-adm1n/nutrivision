import { useState } from "react";
import Header from "./components/Header";
import ScannerTab from "./components/ScannerTab";
import DualQualityTab from "./components/DualQualityTab";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("scanner");
  const [initialScannerText, setInitialScannerText] = useState("");

  const handleInspectInScanner = (ingredientsText) => {
    setInitialScannerText(ingredientsText);
    setActiveTab("scanner");
  };

  return (
    <div className="app-container">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {activeTab === "scanner" && (
          <ScannerTab
            key={initialScannerText || "default"}
            initialText={initialScannerText}
          />
        )}

        {activeTab === "dualQuality" && (
          <DualQualityTab onInspectInScanner={handleInspectInScanner} />
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>
            <strong>NutriVision</strong> — Academic &amp; Consumer Food Label Regulatory Analyzer.
          </p>
          <p className="footer-disclaimer">
            Statutory citations derived from FSSAI (India), EFSA / European Commission Regulations (EC 1333/2008, EU 2022/63), and US FDA 21 CFR. All image processing occurs strictly in memory with zero persistence.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
