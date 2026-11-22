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
  const lowerText = text.toLowerCase();

  for (const rule of regulatoryRules) {
    let matched = false;
    let matchSnippet = "";

    // 1. Check all explicit aliases
    for (const alias of rule.aliases) {
      // Create flexible regex for each alias
      // Handles variations like "INS 171", "INS-171", "INS171", "E 171", "E-171", "E171"
      let pattern;
      const cleanAlias = alias.trim();

      if (/^INS\s*\d+[a-z]?$/i.test(cleanAlias)) {
        const numPart = cleanAlias.replace(/^INS\s*/i, "");
        pattern = new RegExp(`\\b(?:INS|E)[-\\s]?${numPart}\\b`, "i");
      } else if (/^E\s*\d+[a-z]?$/i.test(cleanAlias)) {
        const numPart = cleanAlias.replace(/^E\s*/i, "");
        pattern = new RegExp(`\\b(?:INS|E)[-\\s]?${numPart}\\b`, "i");
      } else if (/^\d+[a-z]?$/.test(cleanAlias)) {
        // Plain number e.g. "171" or "904"
        // Look for it inside parentheses/brackets e.g. "(171)", "(INS 171)", "agent (904)", "(102, 110)"
        pattern = new RegExp(
          `(?:\\[|\\(|,\\s*|&\\s*|and\\s*|\\b(?:ins|e)\\s*)${cleanAlias}(?:\\]|\\)|,\\s*|&\\s*|\\b)`,
          "i"
        );
      } else {
        // General text alias e.g. "Titanium Dioxide", "Palmolein Oil", "Mono- and Diglycerides"
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
        matchedSnippet: matchSnippet,
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
      explanation: "No ingredients provided.",
    };
  }

  const detected = [];

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
    explanation,
  };
}

/**
 * Evaluates EU shelf compliance verdict
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
      title: "EU Non-Compliant (Prohibited on EU Shelves)",
      summary: `Contains additive(s) explicitly banned in food across the European Union: ${names}.`,
      offendingAdditives: bannedAdditives,
      requiredAction:
        "Product cannot be legally placed on EU shelves under Regulation (EU) 2022/63 without reformulating to remove banned substances.",
    };
  }

  // 2. Check for Southampton dyes requiring mandatory Annex V warning
  const annexVDyes = flaggedAdditives.filter(
    (item) => item.classification === "ANNEX_V_DYE" && item.euWarningRequired
  );

  if (annexVDyes.length > 0) {
    // Check if label text contains the required EU warning
    const warningRegex = /adverse\s+effect\s+on\s+activity\s+and\s+attention\s+in\s+children/i;
    const hasRequiredWarning = warningRegex.test(rawText);

    if (!hasRequiredWarning) {
      const dyeNames = annexVDyes.map((a) => `${a.name} (${a.code})`).join(", ");
      return {
        verdict: "RESTRICTED_WARNING_REQUIRED",
        badgeColor: "amber",
        title: "EU Restricted (Mandatory Warning Missing)",
        summary: `Contains Southampton azo dye(s) (${dyeNames}). Under Regulation (EC) No 1333/2008 Annex V, sale in the EU strictly requires the statutory warning: 'may have an adverse effect on activity and attention in children'.`,
        offendingAdditives: annexVDyes,
        requiredAction:
          "Label must either print the mandatory Annex V warning in the local EU language or reformulate using natural colorings (e.g. beta-carotene, beetroot, paprika).",
      };
    }
  }

  // 3. Otherwise compliant
  return {
    verdict: "COMPLIANT",
    badgeColor: "green",
    title: "EU Shelf Compliant",
    summary:
      "No EU-banned additives or undeclared Annex V warning-mandated colorants were detected in this ingredient list.",
    offendingAdditives: [],
    requiredAction:
      "Product meets core EU additive authorization standards (subject to general EU labeling and import requirements).",
  };
}

/**
 * Calculates estimated NOVA processing group (1 to 4)
 */
function calculateNovaGroup(flaggedAdditives, hiddenSugarResult, rawText) {
  const reasons = [];
  const markersFound = [];

  // Check for NOVA 4 markers in additives
  for (const item of flaggedAdditives) {
    if (item.isNova4) {
      markersFound.push(`${item.name} (${item.code})`);
      reasons.push(
        `Contains industrial additive / cosmetic marker: ${item.name} (${item.category})`
      );
    }
  }

  // Check for ultra-processed sugar syrups (Maltodextrin, HFCS, Invert Sugar, Liquid Glucose)
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
    }
  }

  // Check for generic industrial fat/emulsifier terms in raw text
  if (
    /\b(?:hydrogenated|interesterified|fractionated|modified starch|flavoring|flavouring)\b/i.test(
      rawText
    )
  ) {
    const match = rawText.match(
      /\b(?:hydrogenated|interesterified|fractionated|modified starch|flavoring|flavouring)\b/i
    );
    if (match && !markersFound.includes(match[0])) {
      markersFound.push(match[0]);
      reasons.push(`Contains chemically modified industrial ingredient: ${match[0]}`);
    }
  }

  if (markersFound.length >= 1) {
    return {
      group: 4,
      title: "NOVA 4: Ultra-Processed Food (UPF)",
      badgeColor: "red",
      confidence: "HIGH",
      summary:
        "Industrial formulation typically containing 5+ ingredients with substances not used in domestic culinary preparations (e.g. cosmetic colorings, intense emulsifiers, high-intensity flavor enhancers, or fractionated industrial fats).",
      markersFound,
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

  // Group additives for convenient UI display
  const categorized = {
    euBanned: flaggedAdditives.filter(
      (a) => a.classification === "EU_BANNED" || a.euStatus === "BANNED"
    ),
    annexVDyes: flaggedAdditives.filter(
      (a) => a.classification === "ANNEX_V_DYE"
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
    summaryMetrics: {
      totalFlaggedAdditives: flaggedAdditives.length,
      euBannedCount: categorized.euBanned.length,
      annexVDyeCount: categorized.annexVDyes.length,
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
