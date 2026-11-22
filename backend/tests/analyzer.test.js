const assert = require("assert");
const { analyzeIngredients } = require("../services/analyzerService");

console.log("=================================================");
console.log("Running NutriVision Regulatory Analyzer Tests...");
console.log("=================================================\n");

let passedTests = 0;

// Test 1: Core prompt benchmark requirement
// "Sugar, Palmolein Oil, Colours (INS 102, E171), Maltodextrin, Glazing Agent (904)"
{
  const input = "Sugar, Palmolein Oil, Colours (INS 102, E171), Maltodextrin, Glazing Agent (904)";
  const result = analyzeIngredients(input);

  console.log("Test 1: Messy real-world string with mixed INS, E-numbers, parentheticals:");
  console.log("  Input:", input);

  // 1. EU Compliance must be NON_COMPLIANT due to E171 (Titanium Dioxide)
  assert.strictEqual(
    result.euCompliance.verdict,
    "NON_COMPLIANT",
    `Expected verdict NON_COMPLIANT, got ${result.euCompliance.verdict}`
  );
  console.log("  ✓ EU Compliance: NON_COMPLIANT (banned Titanium Dioxide E171 caught)");

  // 2. Additives detected: E171, E102, INS 904, Palmolein
  const additiveCodes = result.flaggedAdditives.map((a) => a.id);
  assert(additiveCodes.includes("e171"), "Expected e171 (Titanium Dioxide) to be detected");
  assert(additiveCodes.includes("e102"), "Expected e102 (Tartrazine) to be detected");
  assert(additiveCodes.includes("ins904"), "Expected ins904 (Shellac) to be detected");
  assert(additiveCodes.includes("palmoil"), "Expected palmoil (Palmolein) to be detected");
  console.log("  ✓ Detected Additives:", result.flaggedAdditives.map((a) => a.name).join(", "));

  // 3. Hidden sugars: Sugar + Maltodextrin -> Sugar Splitting
  assert.strictEqual(result.hiddenSugars.detectedCount, 2, "Expected 2 hidden sugars (Sugar & Maltodextrin)");
  assert.strictEqual(result.hiddenSugars.sugarSplittingDetected, true, "Expected sugar splitting to be true");
  console.log("  ✓ Hidden Sugars:", result.hiddenSugars.detectedSugars.map((s) => s.canonicalName).join(" + "));
  console.log("  ✓ Sugar Splitting Flagged: true");

  // 4. Veg-Dot Blindspot: Shellac (INS 904)
  assert.strictEqual(result.vegBlindspots.hasBlindspots, true, "Expected veg-dot blindspot to be flagged");
  assert.strictEqual(result.vegBlindspots.blindspots[0].id, "ins904");
  console.log("  ✓ Veg-Dot Blindspot Flagged:", result.vegBlindspots.blindspots[0].name);

  // 5. NOVA 4 Group
  assert.strictEqual(result.novaGroup.group, 4, "Expected NOVA Group 4");
  console.log("  ✓ NOVA Classification: Group 4 (Ultra-Processed)");

  passedTests++;
  console.log("--> Test 1 Passed!\n");
}

// Test 2: Southampton dye requiring warning
{
  console.log("Test 2: Annex V dye (Sunset Yellow INS 110) without statutory warning");
  const input = "Carbonated water, sugar, orange flavor, citric acid, Sunset Yellow FCF (INS 110), preservative (211)";
  const result = analyzeIngredients(input);

  assert.strictEqual(
    result.euCompliance.verdict,
    "RESTRICTED_WARNING_REQUIRED",
    `Expected RESTRICTED_WARNING_REQUIRED, got ${result.euCompliance.verdict}`
  );
  assert(result.flaggedAdditives.some((a) => a.id === "e110"));
  console.log("  ✓ EU Verdict: RESTRICTED_WARNING_REQUIRED");
  console.log("  ✓ Detected Southampton Dye: Sunset Yellow FCF");

  passedTests++;
  console.log("--> Test 2 Passed!\n");
}

// Test 3: Southampton dye WITH statutory EU warning present
{
  console.log("Test 3: Annex V dye WITH statutory warning included on label");
  const input = "Water, sugar, citric acid, tartrazine (E102). Warning: may have an adverse effect on activity and attention in children.";
  const result = analyzeIngredients(input);

  assert.strictEqual(
    result.euCompliance.verdict,
    "COMPLIANT",
    `Expected COMPLIANT because warning is present, got ${result.euCompliance.verdict}`
  );
  console.log("  ✓ EU Verdict: COMPLIANT (Warning acknowledged)");

  passedTests++;
  console.log("--> Test 3 Passed!\n");
}

// Test 4: Multiple FSSAI Veg-Dot Blindspots
{
  console.log("Test 4: Multiple animal/insect blindspots (Shellac 904, Beeswax 901, L-Cysteine 920)");
  const input = "Enriched flour, dough conditioner (INS 920), vegetable oil, glazing agent (904), yellow beeswax (INS 901)";
  const result = analyzeIngredients(input);

  assert.strictEqual(result.vegBlindspots.hasBlindspots, true);
  const blindspotIds = result.vegBlindspots.blindspots.map((b) => b.id);
  assert(blindspotIds.includes("ins920"), "Expected INS 920 (L-Cysteine)");
  assert(blindspotIds.includes("ins904"), "Expected INS 904 (Shellac)");
  assert(blindspotIds.includes("ins901"), "Expected INS 901 (Beeswax)");
  console.log("  ✓ Flagged Blindspots:", result.vegBlindspots.blindspots.map((b) => b.name).join(", "));

  passedTests++;
  console.log("--> Test 4 Passed!\n");
}

// Test 5: India-Banned additive (Potassium Bromate INS 924)
{
  console.log("Test 5: FSSAI-Banned additive detection (Potassium Bromate INS 924)");
  const input = "Refined wheat flour, baker's yeast, potassium bromate (INS 924), salt, water";
  const result = analyzeIngredients(input);

  assert(result.flaggedAdditives.some((a) => a.id === "ins924"));
  const bromate = result.flaggedAdditives.find((a) => a.id === "ins924");
  assert.strictEqual(bromate.fssaiStatus, "BANNED_2016");
  console.log("  ✓ Caught India-banned additive:", bromate.name, `(${bromate.fssaiCitation})`);

  passedTests++;
  console.log("--> Test 5 Passed!\n");
}

// Test 6: Clean / minimally processed whole food (NOVA 1)
{
  console.log("Test 6: Clean natural food list (NOVA 1)");
  const input = "100% whole grain rolled oats, chia seeds, dried blueberries";
  const result = analyzeIngredients(input);

  assert.strictEqual(result.euCompliance.verdict, "COMPLIANT");
  assert.strictEqual(result.flaggedAdditives.length, 0);
  assert.strictEqual(result.hiddenSugars.detectedCount, 0);
  assert.strictEqual(result.novaGroup.group, 1);
  console.log("  ✓ Clean Food Verified: Compliant, 0 Additives, NOVA 1");

  passedTests++;
  console.log("--> Test 6 Passed!\n");
}

console.log("=================================================");
console.log(`All ${passedTests} Unit Tests Passed Successfully!`);
console.log("=================================================");
