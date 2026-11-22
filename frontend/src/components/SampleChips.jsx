const DEMO_SAMPLES = [
  {
    id: "drink-mix",
    label: "Orange Drink Mix",
    hint: "Contains EU-Banned Whitener (E171) & Yellow Dyes",
    badge: "Banned in EU",
    badgeType: "danger",
    text: "Sugar, Acidity Regulators (INS 330), Fruit Powder (1%), Colours (INS 171, INS 110, INS 102), Maltodextrin, Stabilizer (INS 466), Artificial Sweetener (INS 955)",
  },
  {
    id: "cookies",
    label: "Cream Sandwich Cookies",
    hint: "3 Sugars (Sugar Splitting) + Insect Glaze",
    badge: "Hidden Sugars",
    badgeType: "warning",
    text: "Refined Wheat Flour (Maida), Sugar (34%), Refined Palmolein Oil, Invert Sugar Syrup, Liquid Glucose, Cocoa Solids, Raising Agents, Emulsifiers (INS 322, INS 471), Glazing Agent (INS 904)",
  },
  {
    id: "namkeen",
    label: "Potato Chips / Namkeen",
    hint: "Fried in Cheap Palmolein Oil + TBHQ Preservative",
    badge: "Ultra-Processed",
    badgeType: "info",
    text: "Potatoes (44%), Edible Vegetable Oil (Palmolein), Gram Pulse Flour, Iodised Salt, Spices, Acidity Regulator (INS 330), Antioxidant (INS 319 - TBHQ)",
  },
  {
    id: "bakery-bread",
    label: "Commercial Sliced Bread",
    hint: "Contains Banned Potassium Bromate + Feather Conditioner",
    badge: "Banned in India",
    badgeType: "danger",
    text: "Refined Wheat Flour (Maida), Water, Baker's Yeast, Sugar, Vegetable Fat, Potassium Bromate (INS 924), Dough Conditioner (INS 920 - L-Cysteine), Preservative (INS 282)",
  },
];

export default function SampleChips({ onSelectSample }) {
  return (
    <div className="sample-chips-container">
      <div className="sample-chips-header">
        <span>⚡ Try a 1-click popular example:</span>
      </div>
      <div className="chips-grid">
        {DEMO_SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            className="chip-btn"
            onClick={() => onSelectSample(sample.text)}
          >
            <div className="chip-top">
              <span className="chip-name">{sample.label}</span>
              <span className={`chip-badge ${sample.badgeType}`}>{sample.badge}</span>
            </div>
            <span className="chip-hint">{sample.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
