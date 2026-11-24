const fs = require("fs");
const path = require("path");

// Load curated regulatory datasets
const rulesPath = path.join(__dirname, "..", "data", "regulatoryRules.json");
const sugarsPath = path.join(__dirname, "..", "data", "hiddenSugars.json");

const regulatoryRules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
const hiddenSugars = JSON.parse(fs.readFileSync(sugarsPath, "utf-8"));

/**
 * Normalizes input text for analysis while preserving original punctuation for inspection
 */
function normalizeText(text) {
  if (!text) return "";
  return String(text).replace(/\r\n/g, "\n");
}

/**
 * Escapes regex special characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Deterministic detection of additives using code patterns, parenthetical numbers, and aliases
 */
function detectAdditives(text) {
  if (!text || typeof text !== "string") return [];

  const matchedRules = new Map();

  for (const rule of regulatoryRules) {
    let matched = false;
    let matchSnippet = "";

    // 1. Check all explicit aliases (longer phrases first for exact attribution)
    const sortedAliases = [...rule.aliases].sort((a, b) => b.length - a.length);
    for (const alias of sortedAliases) {
      let pattern;
      const cleanAlias = alias.trim();

      if (/^INS\s*\d+[a-z]?$/i.test(cleanAlias)) {
        const numPart = cleanAlias.replace(/^INS\s*/i, "");
        pattern = new RegExp(`\\b(?:INS|E)[-\\s]?${numPart}\\b`, "i");
      } else if (/^E\s*\d+[a-z]?$/i.test(cleanAlias)) {
        const numPart = cleanAlias.replace(/^E\s*/i, "");
        pattern = new RegExp(`\\b(?:INS|E)[-\\s]?${numPart}\\b`, "i");
      } else if (/^\d+[a-z]?$/.test(cleanAlias)) {
        // Plain number e.g. "171" or "319" or "904"
        pattern = new RegExp(
          `(?:\\[|\\(|,\\s*|&\\s*|and\\s*|\\b(?:ins|e)\\s*)${cleanAlias}(?:\\]|\\)|,\\s*|&\\s*|\\b)`,
          "i"
        );
      } else {
        // General text alias e.g. "Titanium Dioxide", "TBHQ", "Palmolein Oil"
        const escaped = escapeRegex(cleanAlias).replace(/\\\s\+/g, "\\s+");
        pattern = new RegExp(`\\b${escaped}\\b`, "i");
      }

      const match = text.match(pattern);
      if (match) {
        matched = true;
        matchSnippet = match[0];
        break;
      }
    }

    if (matched) {
      matchedRules.set(rule.id, {
        rule,
        matchedSnippet: matchSnippet.trim(),
      });
    }
  }

  return Array.from(matchedRules.values()).map(({ rule, matchedSnippet }) => ({
    id: rule.id,
    code: rule.code,
    name: rule.name,
    category: rule.category,
    matchedSnippet,
    classification: rule.classification,
    riskLevel: rule.riskLevel,
    euStatus: rule.euStatus,
    euDetails: rule.euDetails,
    euCitation: rule.euCitation,
    euWarningRequired: Boolean(rule.euWarningRequired),
    fssaiStatus: rule.fssaiStatus,
    fssaiDetails: rule.fssaiDetails,
    fssaiCitation: rule.fssaiCitation,
    fdaStatus: rule.fdaStatus,
    fdaDetails: rule.fdaDetails,
    fdaCitation: rule.fdaCitation,
    explanation: rule.explanation,
    isNova4: Boolean(rule.isNova4),
  }));
}

/**
 * Detects hidden sugars and sugar-splitting tactics
 */
function detectHiddenSugars(text) {
  if (!text || typeof text !== "string") {
    return {
      detectedCount: 0,
      detectedSugars: [],
      sugarSplittingDetected: false,
      sugarTriggers: [],
      explanation: "No ingredients provided.",
    };
  }

  const detected = [];
  const sugarTriggers = [];

  for (const sugar of hiddenSugars) {
    let found = false;
    let matchedAlias = "";

    for (const alias of sugar.aliases) {
      const escaped = escapeRegex(alias).replace(/\\\s\+/g, "\\s+");
      const pattern = new RegExp(`\\b${escaped}\\b`, "i");
      const match = text.match(pattern);
      if (match) {
        found = true;
        matchedAlias = match[0];
        break;
      }
    }

    if (found) {
      detected.push({
        canonicalName: sugar.canonicalName,
        type: sugar.type,
        matchedAlias,
        risk: sugar.risk,
      });
      sugarTriggers.push(matchedAlias.toLowerCase());
    }
  }

  const detectedCount = detected.length;
  const sugarSplittingDetected = detectedCount >= 2;

  let explanation = "";
  if (sugarSplittingDetected) {
    explanation = `Sugar splitting detected (${detectedCount} distinct sugar varieties identified). Food manufacturers split sugars into multiple forms (e.g. Table Sugar, Maltodextrin, Liquid Glucose) so no single sugar appears as the primary #1 ingredient on the label.`;
  } else if (detectedCount === 1) {
    explanation = `1 sugar/sweetener identified (${detected[0].canonicalName}).`;
  } else {
    explanation = "No added refined sugars or chemical caloric sweeteners detected in the ingredient text.";
  }

  return {
    detectedCount,
    detectedSugars: detected,
    sugarSplittingDetected,
    sugarTriggers,
    explanation,
  };
}

/**
 * Checks for FSSAI vegetarian logo blindspots (animal/insect additives exempt from brown dot)
 */
function detectVegDotBlindspots(flaggedAdditives) {
  const blindspots = flaggedAdditives.filter(
    (item) => item.classification === "VEG_DOT_BLINDSPOT"
  );

  const hasBlindspots = blindspots.length > 0;
  const vegBlindspotTriggers = blindspots.map((b) => (b.matchedSnippet || b.name).toLowerCase());
  let explanation = "";

  if (hasBlindspots) {
    const names = blindspots.map((b) => `${b.name} (${b.code})`).join(", ");
    explanation = `Alert for vegetarians: Under FSSAI Packaging & Labelling regulations, food additives, glazing agents, and processing aids derived from insects/animals (such as ${names}) are legally exempt from triggering India's mandatory Brown Non-Veg Dot. Products carrying the Green Veg Dot may still contain these animal-derived substances.`;
  } else {
    explanation = "No known animal/insect-derived additive blindspots detected.";
  }

  return {
    hasBlindspots,
    blindspots,
    vegBlindspotTriggers,
    explanation,
  };
}

/**
 * Evaluates EU shelf compliance verdict with scientifically defensible scope
 */
function evaluateEuCompliance(flaggedAdditives, rawText) {
  // 1. Check for EU-banned additives
  const bannedAdditives = flaggedAdditives.filter(
    (item) => item.euStatus === "BANNED" || item.classification === "EU_BANNED"
  );

  if (bannedAdditives.length > 0) {
    const names = bannedAdditives.map((a) => `${a.name} (${a.code})`).join(", ");
    return {
      verdict: "NON_COMPLIANT",
      badgeColor: "red",
      title: "Prohibited on European Shelves",
      pill: "BANNED IN EU",
      summary: `Contains additive(s) explicitly banned in food across the European Union: ${names}.`,
      scopeDisclaimer:
        "Note: This rule engine screens declared ingredients against EU statutory regulations (such as Regulation (EU) 2022/63) and does not verify chemical contaminant limits or laboratory pesticide thresholds.",
      offendingAdditives: bannedAdditives,
      restrictedAdditives: [],
      hasRestrictedAdditives: false,
      cautionNote: null,
      requiredAction:
        "Product cannot be legally placed on EU shelves under Regulation (EU) 2022/63 without reformulating to remove banned substances.",
    };
  }

  // 2. Check for Southampton dyes requiring mandatory Annex V warning
  const annexVDyes = flaggedAdditives.filter(
    (item) => item.classification === "ANNEX_V_DYE" && item.euWarningRequired
  );

  if (annexVDyes.length > 0) {
    const warningRegex = /adverse\s+effect\s+on\s+activity\s+and\s+attention\s+in\s+children/i;
    const hasRequiredWarning = warningRegex.test(rawText);

    if (!hasRequiredWarning) {
      const dyeNames = annexVDyes.map((a) => `${a.name} (${a.code})`).join(", ");
      return {
        verdict: "RESTRICTED_WARNING_REQUIRED",
        badgeColor: "amber",
        title: "Mandatory Child Warning Required in EU",
        pill: "WARNING REQUIRED",
        summary: `Contains Southampton azo dye(s) (${dyeNames}). Under Regulation (EC) No 1333/2008 Annex V, sale in the EU strictly requires the statutory warning: 'may have an adverse effect on activity and attention in children'.`,
        scopeDisclaimer:
          "Note: This rule engine screens declared ingredients against EU statutory regulations and does not verify laboratory thresholds.",
        offendingAdditives: annexVDyes,
        restrictedAdditives: [],
        hasRestrictedAdditives: false,
        cautionNote: null,
        requiredAction:
          "Label must either print the mandatory Annex V warning in the local EU language or reformulate using natural colorings (e.g. beta-carotene, beetroot, paprika).",
      };
    }
  }

  // 3. Check for Category-Restricted additives (e.g. TBHQ INS 319 / E319, strictly capped by dosage)
  const restrictedAdditives = flaggedAdditives.filter(
    (item) =>
      item.euStatus === "RESTRICTED" ||
      item.classification === "EU_RESTRICTED" ||
      item.euStatus === "STRICTLY_LIMITED"
  );

  const hasRestrictedAdditives = restrictedAdditives.length > 0;
  const restrictedNames = restrictedAdditives
    .map((a) => `${a.name} (${a.code})`)
    .join(", ");

  let cautionNote = null;
  if (hasRestrictedAdditives) {
    cautionNote = `Contains additive(s) subject to category and dosage restrictions under EU Regulation (EC) 1333/2008: ${restrictedNames}. Authorized only in specific food categories with strictly capped maximum mg/kg limits.`;
  }

  // 4. Scientifically defensible green pass: screens declared ingredients only
  return {
    verdict: "COMPLIANT",
    badgeColor: hasRestrictedAdditives ? "amber" : "green",
    title: "No EU-Banned Additives Detected",
    pill: "NO BANNED ADDITIVES",
    summary:
      "No EU-prohibited additives or mandatory Annex V child-warning dyes were found in the declared text. Note: This rule engine screens declared ingredients only and does not verify laboratory limits such as heavy metals, pesticides, or dosage caps.",
    scopeDisclaimer:
      "Note: This rule engine screens declared ingredients only and does not verify laboratory limits such as heavy metals, pesticides, or dosage caps.",
    offendingAdditives: [],
    restrictedAdditives,
    hasRestrictedAdditives,
    cautionNote,
    requiredAction: hasRestrictedAdditives
      ? "Category-restricted additives present; verify dosage levels comply with EU Regulation (EC) 1333/2008 maximum limits."
      : "Product contains no EU-prohibited additives (declared ingredient screening only).",
  };
}

/**
 * Calculates estimated NOVA processing group (1 to 4) and captures exact trigger tokens
 */
function calculateNovaGroup(flaggedAdditives, hiddenSugarResult, rawText) {
  const reasons = [];
  const markersFound = [];
  const novaTriggers = [];

  // 1. Check for NOVA 4 markers in detected additives
  for (const item of flaggedAdditives) {
    if (item.isNova4) {
      markersFound.push(`${item.name} (${item.code})`);
      reasons.push(
        `Contains industrial additive / cosmetic marker: ${item.name} (${item.category})`
      );
      if (item.matchedSnippet) {
        novaTriggers.push(item.matchedSnippet.toLowerCase());
      } else {
        novaTriggers.push(item.name.toLowerCase());
      }
    }
  }

  // 2. Check for ultra-processed sugar syrups (Maltodextrin, HFCS, Invert Sugar, Liquid Glucose)
  for (const sugar of hiddenSugarResult.detectedSugars) {
    if (
      /maltodextrin|glucose syrup|liquid glucose|invert|hfcs|corn syrup/i.test(
        sugar.canonicalName
      )
    ) {
      markersFound.push(sugar.canonicalName);
      reasons.push(
        `Contains industrial hydrolyzed carbohydrate: ${sugar.canonicalName}`
      );
      if (sugar.matchedAlias) {
        novaTriggers.push(sugar.matchedAlias.toLowerCase());
      }
    }
  }

  // 3. Check for industrial flavorings, chemically modified fats, and texturizers in raw text
  const industrialPatterns = [
    /\b(?:nature\s+identical\s+flavou?r(?:ing)?(?:\s+substances)?)\b/gi,
    /\b(?:artificial\s+flavou?r(?:ing)?(?:\s+substances)?)\b/gi,
    /\b(?:flavou?ring(?:\s+substances)?)\b/gi,
    /\b(?:flavou?r\s+enhancers?)\b/gi,
    /\b(?:hydrogenated\s+[a-z\s]+|interesterified|fractionated|modified\s+starch)\b/gi,
    /\b(?:emulsifiers?|stabilizers?|thickeners?|acidity\s+regulators?|raising\s+agents?)\b/gi,
  ];

  for (const pattern of industrialPatterns) {
    const matches = rawText.match(pattern);
    if (matches) {
      for (const m of matches) {
        const cleanToken = m.trim().toLowerCase();
        if (!novaTriggers.includes(cleanToken)) {
          novaTriggers.push(cleanToken);
          markersFound.push(cleanToken);
          reasons.push(`Contains chemically modified / cosmetic ingredient: ${cleanToken}`);
        }
      }
    }
  }

  // Deduplicate triggers
  const uniqueTriggers = Array.from(new Set(novaTriggers));

  if (uniqueTriggers.length >= 1) {
    return {
      group: 4,
      title: "NOVA 4: Ultra-Processed Food (UPF)",
      badgeColor: "red",
      confidence: "HIGH",
      summary:
        "Industrial formulation typically containing 5+ ingredients with substances not used in domestic culinary preparations (e.g. cosmetic colorings, intense emulsifiers, high-intensity flavor enhancers, or fractionated industrial fats).",
      markersFound,
      novaTriggers: uniqueTriggers,
      reasons,
    };
  }

  // Check if processed foods (Group 3): added sugar, salt, oil added to whole foods
  if (
    hiddenSugarResult.detectedCount > 0 ||
    /\b(?:salt|oil|vinegar)\b/i.test(rawText)
  ) {
    return {
      group: 3,
      title: "NOVA 3: Processed Food",
      badgeColor: "amber",
      confidence: "MEDIUM",
      summary:
        "Relatively simple foods manufactured by adding culinary ingredients like salt, sugar, or oil to Group 1 foods (e.g. canned vegetables, cheese, cured meats).",
      markersFound: [],
      novaTriggers: [],
      reasons: ["Contains added culinary ingredients without cosmetic chemical markers."],
    };
  }

  // Group 1 or 2
  return {
    group: 1,
    title: "NOVA 1: Unprocessed or Minimally Processed",
    badgeColor: "green",
    confidence: "MEDIUM",
    summary:
      "Natural agricultural or animal foods altered by processes such as drying, boiling, freezing, or pasteurization without added fats, sugars, or industrial additives.",
    markersFound: [],
    novaTriggers: [],
    reasons: ["No industrial additives, fractionated oils, or artificial sweeteners detected."],
  };
}

/**
 * Main analysis function
 */
function analyzeIngredients(rawText) {
  const text = normalizeText(rawText);

  const flaggedAdditives = detectAdditives(text);
  const hiddenSugarsResult = detectHiddenSugars(text);
  const vegBlindspots = detectVegDotBlindspots(flaggedAdditives);
  const euCompliance = evaluateEuCompliance(flaggedAdditives, text);
  const novaGroup = calculateNovaGroup(flaggedAdditives, hiddenSugarsResult, text);

  // Categorize additives
  const categorized = {
    euBanned: flaggedAdditives.filter(
      (a) => a.classification === "EU_BANNED" || a.euStatus === "BANNED"
    ),
    annexVDyes: flaggedAdditives.filter(
      (a) => a.classification === "ANNEX_V_DYE"
    ),
    euRestricted: flaggedAdditives.filter(
      (a) =>
        a.euStatus === "RESTRICTED" ||
        a.classification === "EU_RESTRICTED" ||
        a.euStatus === "STRICTLY_LIMITED"
    ),
    usRestricted: flaggedAdditives.filter(
      (a) => a.classification === "US_RESTRICTED"
    ),
    indiaBanned: flaggedAdditives.filter(
      (a) => a.classification === "INDIA_BANNED"
    ),
    vegBlindspots: flaggedAdditives.filter(
      (a) => a.classification === "VEG_DOT_BLINDSPOT"
    ),
    nova4Markers: flaggedAdditives.filter((a) => a.isNova4),
  };

  // Expose exact triggers for every audit category
  const novaTriggers = novaGroup.novaTriggers || [];
  const bannedAdditives = categorized.euBanned;
  const restrictedAdditives = categorized.euRestricted;
  const sugarTriggers = hiddenSugarsResult.sugarTriggers || [];
  const vegBlindspotTriggers = vegBlindspots.vegBlindspotTriggers || [];

  return {
    analyzedAt: new Date().toISOString(),
    characterCount: text.length,
    rawText: text,
    euCompliance,
    novaGroup,
    flaggedAdditives,
    categorized,
    hiddenSugars: hiddenSugarsResult,
    vegBlindspots,
    // Exact audit category triggers
    novaTriggers,
    bannedAdditives,
    restrictedAdditives,
    sugarTriggers,
    vegBlindspotTriggers,
    summaryMetrics: {
      totalFlaggedAdditives: flaggedAdditives.length,
      euBannedCount: categorized.euBanned.length,
      annexVDyeCount: categorized.annexVDyes.length,
      euRestrictedCount: categorized.euRestricted.length,
      hiddenSugarsCount: hiddenSugarsResult.detectedCount,
      vegBlindspotCount: vegBlindspots.blindspots.length,
      novaGroupNumber: novaGroup.group,
    },
  };
}

module.exports = {
  analyzeIngredients,
  detectAdditives,
  detectHiddenSugars,
  detectVegDotBlindspots,
  evaluateEuCompliance,
  calculateNovaGroup,
};
