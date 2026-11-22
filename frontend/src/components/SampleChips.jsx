const DEMO_SAMPLES = [
  {
    id: "drink-mix",
    label: "Instant Drink Premix (EU Banned E171 + Southampton Dyes)",
    badge: "EU Non-Compliant",
    badgeType: "danger",
    text: "Sugar, Acidity Regulators (INS 330), Fruit Powder (1%), Colours (INS 171, INS 110, INS 102), Maltodextrin, Stabilizer (INS 466), Artificial Sweetener (INS 955)",
  },
  {
    id: "cookies",
    label: "Sweet Cream Biscuits (Sugar Splitting + Shellac Veg Blindspot)",
    badge: "Veg Blindspot + Sugar Split",
    badgeType: "warning",
    text: "Refined Wheat Flour (Maida), Sugar (34%), Refined Palmolein Oil, Invert Sugar Syrup, Liquid Glucose, Cocoa Solids, Raising Agents, Emulsifiers (INS 322, INS 471), Glazing Agent (INS 904)",
  },
  {
    id: "namkeen",
    label: "Savory Namkeen / Potato Chips (Palmolein + TBHQ)",
    badge: "NOVA 4 Ultra-Processed",
    badgeType: "info",
    text: "Potatoes (44%), Edible Vegetable Oil (Palmolein), Gram Pulse Flour, Iodised Salt, Spices, Acidity Regulator (INS 330), Antioxidant (INS 319 - TBHQ)",
  },
  {
    id: "bakery-bread",
    label: "Commercial Bread (India-Banned Bromate + L-Cysteine Feather Blindspot)",
    badge: "India Banned + Blindspot",
    badgeType: "danger",
    text: "Refined Wheat Flour (Maida), Water, Baker's Yeast, Sugar, Vegetable Fat, Potassium Bromate (INS 924), Dough Conditioner (INS 920 - L-Cysteine), Preservative (INS 282)",
  },
];

export default function SampleChips({ onSelectSample }) {
  return (
    <div className="sample-chips-container">
      <div className="sample-chips-header">
        <span className="chips-icon">⚡</span>
        <span className="chips-title">One-Click Demonstration Samples:</span>
      </div>
      <div className="chips-grid">
        {DEMO_SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            className="chip-btn"
            onClick={() => onSelectSample(sample.text)}
          >
            <span className={`chip-badge ${sample.badgeType}`}>{sample.badge}</span>
            <span className="chip-label">{sample.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
