import { SparklesIcon } from "./Icons";

const DEMO_SAMPLES = [
  {
    id: "drink-mix",
    label: "Instant Drink Mix",
    badge: "EU-Banned E171",
    badgeClass: "badge-danger",
    detail: "Titanium Dioxide + Sunset Yellow Dyes",
    text: "Sugar, Acidity Regulators (INS 330), Fruit Powder (1%), Colours (INS 171, INS 110, INS 102), Maltodextrin, Stabilizer (INS 466), Artificial Sweetener (INS 955)",
  },
  {
    id: "cookies",
    label: "Cream Cookies",
    badge: "Sugar Splitting",
    badgeClass: "badge-warning",
    detail: "3 Hidden Sugars + Shellac Insect Glaze",
    text: "Refined Wheat Flour (Maida), Sugar (34%), Refined Palmolein Oil, Invert Sugar Syrup, Liquid Glucose, Cocoa Solids, Raising Agents, Emulsifiers (INS 322, INS 471), Glazing Agent (INS 904)",
  },
  {
    id: "namkeen",
    label: "Potato Chips / Namkeen",
    badge: "Palmolein + TBHQ",
    badgeClass: "badge-neutral",
    detail: "High Saturated Fat + Synthetic Antioxidant",
    text: "Potatoes (44%), Edible Vegetable Oil (Palmolein), Gram Pulse Flour, Iodised Salt, Spices, Acidity Regulator (INS 330), Antioxidant (INS 319 - TBHQ)",
  },
  {
    id: "bakery-bread",
    label: "Commercial Bread",
    badge: "India Banned",
    badgeClass: "badge-danger",
    detail: "Potassium Bromate + Feather Conditioner",
    text: "Refined Wheat Flour (Maida), Water, Baker's Yeast, Sugar, Vegetable Fat, Potassium Bromate (INS 924), Dough Conditioner (INS 920 - L-Cysteine), Preservative (INS 282)",
  },
];

export default function SampleChips({ onSelectSample }) {
  return (
    <div className="presets-wrapper">
      <div className="presets-header">
        <SparklesIcon className="icon-subtle" />
        <span className="presets-title">Quick Demo Ingredient Presets</span>
      </div>
      <div className="presets-grid">
        {DEMO_SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            className="preset-card"
            onClick={() => onSelectSample(sample.text)}
          >
            <div className="preset-card-top">
              <span className="preset-title">{sample.label}</span>
              <span className={`preset-pill ${sample.badgeClass}`}>{sample.badge}</span>
            </div>
            <span className="preset-detail">{sample.detail}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
