import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_BY_ID } from "../src/data.js";
import { validateSetup } from "../src/engine.js";
import {
  CURATED_PROFILES,
  OFFICIAL_PRESETS,
  buildCuratedPreset,
  favoriteFromSelection,
  guidedPreset,
  profileForPreferences,
  setupWarnings,
  validatePresetDefinition,
} from "../src/presets.js";

test("las tres formaciones oficiales de 8 jugadores son exactas y válidas", () => {
  assert.equal(OFFICIAL_PRESETS.length, 3);
  assert.deepEqual(OFFICIAL_PRESETS[0].roles, [
    "chef",
    "empath",
    "fortune_teller",
    "undertaker",
    "virgin",
    "drunk",
    "scarlet_woman",
    "imp",
  ]);
  assert.equal(OFFICIAL_PRESETS[0].drunkBelief, "investigator");
  OFFICIAL_PRESETS.forEach((preset) => {
    assert.equal(preset.source, "official");
    assert.equal(validatePresetDefinition({ ...preset, count: 8 }).valid, true);
    assert.equal(validateSetup(8, preset.roles).valid, true);
  });
});

test("todos los perfiles generan una formación legal entre 5 y 15 jugadores", () => {
  for (let count = 5; count <= 15; count += 1) {
    for (const profile of CURATED_PROFILES) {
      const preset = buildCuratedPreset(count, profile.id);
      assert.equal(preset.roles.length, count, `${profile.id} con ${count}`);
      assert.equal(
        new Set(preset.roles).size,
        count,
        `${profile.id} sin duplicados`,
      );
      assert.equal(
        validateSetup(count, preset.roles).valid,
        true,
        `${profile.id} con composición válida`,
      );
      if (preset.roles.includes("drunk")) {
        assert.equal(CHARACTER_BY_ID[preset.drunkBelief].team, "townsfolk");
        assert.equal(preset.roles.includes(preset.drunkBelief), false);
      }
    }
  }
});

test("la guía selecciona un perfil coherente con experiencia y estilo", () => {
  assert.equal(profileForPreferences("new", "balanced"), "first-game");
  assert.equal(profileForPreferences("experienced", "balanced"), "experienced");
  assert.equal(profileForPreferences("regular", "information"), "information");
  assert.equal(profileForPreferences("experienced", "deception"), "deception");
  assert.equal(
    guidedPreset(10, "regular", "execution").title,
    "Riesgo en las ejecuciones",
  );
});

test("el generador usa etiquetas y avisa de decisiones de preparación", () => {
  const preset = buildCuratedPreset(8, "deception");
  const warnings = setupWarnings(8, preset.roles, "new");
  assert.ok(
    preset.roles.some((id) => ["spy", "poisoner", "baron"].includes(id)),
  );
  assert.ok(warnings.some((warning) => warning.includes("bluffs")));
  if (preset.roles.includes("recluse") || preset.roles.includes("spy")) {
    assert.ok(
      warnings.some((warning) => warning.includes("Registros avanzados")),
    );
  }
});

test("una favorita conserva un reparto válido y rechaza el Borracho ilegal", () => {
  const official = OFFICIAL_PRESETS[0];
  const favorite = favoriteFromSelection(
    "Mi primera mesa",
    8,
    official.roles,
    "investigator",
  );
  assert.equal(favorite.source, "favorite");
  assert.equal(validatePresetDefinition(favorite).valid, true);
  assert.equal(
    validatePresetDefinition({ ...favorite, drunkBelief: "chef" }).valid,
    false,
  );
});
