# P23 Long-Term Balance Indicator Set

Five representative indicators for wave-to-wave comparison. No runtime redesign required — consumed via profile config and reporting modules.

## Indicators

### 1. `p23_ind_archetype_stability`

- **Dimension:** archetype_strength
- **Interpretation:** Share of representative archetype families that emerge with distinctive signal match (≥ 0.65 archetype score) across regression matrix rows.
- **Healthy range:** 0.70 – 1.00
- **Baseline:** 0.78
- **Wave comparison:** Rising = families stay distinguishable after content waves; falling = homogenization risk.

### 2. `p23_ind_replay_novelty`

- **Dimension:** replay_distinctiveness
- **Interpretation:** Average novelty boost from repetition pressure reports on tuned vs baseline histories (normalized 0–1).
- **Healthy range:** 0.55 – 0.90
- **Baseline:** 0.62
- **Wave comparison:** Rising = replays feel less repetitive; falling = overlap crowding.

### 3. `p23_ind_stage_pacing_health`

- **Dimension:** stage_pacing_health
- **Interpretation:** Mean absolute pacing multiplier delta across martial vs scholar (or wealth vs hermit) representative pairs; inverted to 0–1 health score.
- **Healthy range:** 0.50 – 0.95
- **Baseline:** 0.68
- **Wave comparison:** Stable high = archetypes keep distinct rhythms; collapse = pacing homogenization.

### 4. `p23_ind_mid_late_payoff`

- **Dimension:** mid_late_payoff
- **Interpretation:** Midlife slice consequence engagement score (P17 patterns + seed flag match) for stronger vs weaker slice delta, normalized.
- **Healthy range:** 0.45 – 0.90
- **Baseline:** 0.58
- **Wave comparison:** Rising = later-life stakes strengthen; flat with volume up = low-value wave.

### 5. `p23_ind_legacy_endgame_resonance`

- **Dimension:** legacy_resonance + endgame_aftertaste
- **Interpretation:** Combined endgame category match + historical memory tone alignment for legacy/endgame slices (0–1).
- **Healthy range:** 0.50 – 0.92
- **Baseline:** 0.64
- **Wave comparison:** Rising = closures land with memory aftertaste; falling = category-only compliance.

## Usage

- Profile configs: `longTermBalanceIndicatorConfigs` on `WorldProfile`
- Runtime evaluation: `src/p23/balanceIndicators.ts`
- Reports: `docs/test-reports/p23-acceptance-matrix-latest.json`, P23 gate/closure
