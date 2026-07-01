# P64 Merchant Pressure/Payoff Flattening Audit

> **Date:** 2026-06-28
> **Stage:** P64 Merchant Magnate Differentiated Pressure And Payoff
> **Branch:** `codex/p64-wuxia-merchant-magnate-differentiated-pressure-payoff`
> **Type:** Documentation-only — no runtime changes

---

## 1. Audit Purpose

P64-001 audits where the three ordinary-origin merchant ascents (apprentice, tavern, peasant) still flatten back into one shared magnate experience at the `magnate_midlife_pressure` and `magnate_payoff` stages. This identifies what must be differentiated to keep the three paths distinct beyond entry.

---

## 2. Current State: Shared Magnate Chain

### 2.1 Magnate Midlife Pressure (age 36-40)

**Event:** `magnate_midlife_pressure` in `sample-lines-spine.json`

| Field | Value |
|-------|-------|
| Text | "商号遍九州，人情债也遍九州。每笔赊账、每位合作伙伴、每桩江湖义气，都是一根牵着你的线——巨贾的担子，比掌柜的重得多。" |
| Flags set | `magnate_midlife_pressure_done` |
| Gate condition | Accepts `apprentice_merchant_bridge_crossed` OR `tavern_merchant_bridge_crossed` OR `peasant_merchant_bridge_crossed` |

**Assessment:** The text is **generic magnate pressure** — "人情债" (debts of reciprocity/connections) is the same framing regardless of whether the player came via craft partnership (apprentice), social network (tavern), or physical labor/grain trade (peasant). **FLATTENING.**

### 2.2 Magnate Payoff (age 42-46)

**Event:** `magnate_payoff` in `sample-lines-spine.json`

| Field | Value |
|-------|-------|
| Text | "半生经营，你的商号已成江湖不可或缺的血脉。可每一笔利润都沾着人情，每一桩合作都系着风险——巨贾之位，坐上去容易，守住难。" |
| Flags set | `magnate_payoff_done`, `magnate_payoff_resolved`, `merchant_age45_payoff_done` |
| Gate condition | Accepts `apprentice_merchant_bridge_crossed` OR `tavern_merchant_bridge_crossed` OR `peasant_merchant_bridge_crossed` |

**Assessment:** The text is **generic magnate success** — "利润沾着人情" (profits stained with reciprocity) is the same framing for all three origins. **FLATTENING.**

---

## 3. Expression Surface Analysis

### 3.1 merchantCurrentGoal() at Pressure/Payoff Stages

**File:** `src/p50/sampleLineExpression.ts` (lines 117-149)

```typescript
function merchantCurrentGoal(flags: Record<string, unknown>, age: number): string {
  if (flags.magnate_payoff_done) {
    return '巨贾之位已成，守住比扩张更难';  // Same for all three
  }
  if (flags.magnate_midlife_pressure_done) {
    return '商号遍九州，人情债也遍九州';    // Same for all three
  }
  if (flags.magnate_on_ramp_done) {
    return '产业初成，巨贾之路刚起步';      // Same for all three
  }
  // ... generic merchant midlife states
}
```

**Assessment:** All three magnate-stage goals are **identical text** across all three bridge origins. No origin-specific pressure or payoff emphasis. **FLATTENING at magnate midlife/payoff.**

### 3.2 merchantAge40Identity() at Magnate Stage

**File:** `src/p50/sampleLineExpression.ts` (lines 217-228)

```typescript
function merchantAge40Identity(flags: Record<string, unknown>): string | undefined {
  if (!flags.merchant_age40_identity_done) {
    return undefined;
  }
  if (flags.magnate_on_ramp_done) {
    return '你是富甲一方却身不由己的巨贾，财富带来地位，也带来数不清的人情与责任';
  }
  // ...
}
```

**Assessment:** The magnate_on_ramp identity text differentiates based on `magnate_on_ramp_done` but **does not check which bridge** the player crossed. **FLATTENING at magnate stage.**

---

## 4. Gate Architecture Analysis

### 4.1 Healthy Reuse (Do NOT Change)

| Gate | Accepts | Assessment |
|------|---------|------------|
| `magnate_on_ramp` | All three bridge flags | **Healthy reuse** — single entry point to magnate chain |
| `magnate_midlife_pressure` | All three bridge flags | **Healthy reuse** — pressure gate should accept all qualified magnates |
| `magnate_payoff` | All three bridge flags | **Healthy reuse** — payoff gate should accept all qualified magnates |
| `merchant_midlife_debt_milestone` | All three bridge flags | **Healthy reuse** — pre-magnate milestone |

### 4.2 Flattening vs Necessary Sharing

| Element | Current State | Problem | Fix Direction |
|---------|---------------|---------|--------------|
| `magnate_midlife_pressure` event text | Generic "人情债" | All three paths read the same pressure | Origin-specific pressure emphasis |
| `magnate_payoff` event text | Generic "利润/风险" | All three paths read the same payoff | Origin-specific payoff emphasis |
| `merchantCurrentGoal()` at pressure | Generic "商号遍九州，人情债也遍九州" | Same goal text for all | Origin-specific pressure goal |
| `merchantCurrentGoal()` at payoff | Generic "巨贾之位已成" | Same goal text for all | Origin-specific payoff goal |
| `merchantAge40Identity()` at magnate | Generic magnate identity | No bridge-specific identity | Already differentiated at entry; midlife/payoff should extend |

---

## 5. Origin-Specific Seed Analysis

### 5.1 Apprentice (P58) Pressure Source
- **Identity seed:** Craft skill → Trade partnership
- **Pressure source:** Partnership debts, collaborator dependencies, craft-supply chain obligations
- **Payoff source:** Established trade network, supplier relationships, commercial reputation

### 5.2 Tavern Hand (P59) Pressure Source
- **Identity seed:** Social service → Guest network → Ally referral
- **Pressure source:** Network obligations, reputation maintenance, social capital debts
- **Payoff source:** Client relationships, hospitality industry standing, social influence

### 5.3 Peasant (P61) Pressure Source
- **Identity seed:** Physical labor → Swap crew → Grain trade offer
- **Pressure source:** Physical logistics, supply chain management,体力透支
- **Payoff source:** Trade route control, commodity access, market position

---

## 6. Differentiation Opportunities

### 6.1 Pressure Differentiation

| Origin | Pressure Emphasis | Suggested Framing |
|--------|-------------------|-------------------|
| Apprentice | Partnership/craft debts | 手艺合作债：供货、销路、技术依赖 |
| Tavern | Social/reputation debts | 人脉担保债：面子、介绍、回头客 |
| Peasant | Logistics/physical debts | 体力物流债：运力、仓储、供应链 |

### 6.2 Payoff Differentiation

| Origin | Payoff Emphasis | Suggested Framing |
|--------|-----------------|-------------------|
| Apprentice | Trade network value | 商路掌控：供货销路尽在掌握 |
| Tavern | Social capital value | 江湖人脉：八方宾客皆是资源 |
| Peasant | Physical infrastructure | 物流根基：车马仓储皆为资产 |

---

## 7. Scope Boundary

### 7.1 What P64 CAN Change

- `magnate_midlife_pressure` event text (bounded origin-specific flavor)
- `magnate_payoff` event text (bounded origin-specific flavor)
- `merchantCurrentGoal()` text at magnate pressure/payoff stages
- Light configuration markers for pressure/payoff differentiation
- Expression tests for pressure/payoff differentiation

### 7.2 What P64 MUST NOT Change

- Gate architecture (all three bridge flags must still satisfy magnate gates)
- P55 magnate chain order (on_ramp → pressure → payoff)
- Flags set by magnate events (`magnate_midlife_pressure_done`, `magnate_payoff_done`)
- The unified `merchant_magnate` mixed identity
- P55/P58/P59/P61/P63 evidence

---

## 8. Audit Conclusions

1. **Gate architecture is sound** — all three bridges correctly share the magnate gates. This is healthy reuse and must not be broken.

2. **Pressure flattening is real** — `magnate_midlife_pressure` event text and `merchantCurrentGoal()` at pressure stage use generic "人情债" framing that reads identically regardless of origin path.

3. **Payoff flattening is real** — `magnate_payoff` event text and `merchantCurrentGoal()` at payoff stage use generic "利润/风险" framing that reads identically regardless of origin path.

4. **Entry differentiation is intact** — P63 successfully differentiated the magnate entry (`magnate_on_ramp`). The flattening occurs at the **midlife pressure and payoff stages**.

5. **P64 target is bounded** — Add minimum bounded differentiation at pressure and payoff through event text and expression surface changes, keeping the unified magnate identity intact.

---

## 9. Runtime Behavior Impact

**This story does not change runtime behavior.** This is a documentation-only audit to establish the flattening truth source for P64 differentiation work.
