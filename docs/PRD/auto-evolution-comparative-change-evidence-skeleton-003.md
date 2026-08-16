# PRD — Auto Evolution Skeleton 003: Comparative Change Evidence

> 状态：CLOSED / Human accepted
>
> 性质：探索型骨架实验历史证据；不授权重新执行、retain/revert、auto PRD 或下一 Skeleton。

## Goal

Prove one controlled baseline/candidate pair can be compared through player-observable material only, with one external participant's comparative feedback returned intact to Human.

## Authority

This PRD is subordinate to:

`docs/product/auto-evolution-model.md` and `docs/governance/current-product-stage.md`

If this PRD, its paired JSON, or runtime inference disagree, authority is:

`auto-evolution-model + current-product-stage > PRD.md > prd.json > runtime inference`.

## Human-authored modification

In the isolated candidate workspace only, append this exact sentence to `birth_wuxia_family.content.text` in `src/data/lines/general.json`:

`家中长辈常在夜里讲述江湖旧事。`

Do not write this sentence into the Human origin source.

## Fixed paired run inputs

- persona: `p8-martial-lin`
- seed: `101`
- endAge: `2`
- maxSteps: `120`
- catalogVersion: `ae-skeleton-003-comparison-v1`
- baseline runRef: `ae-skeleton-003-baseline`
- candidate runRef: `ae-skeleton-003-candidate`

## External smoke authorization

After every deterministic prerequisite passes, exactly one DeepSeek comparative invocation is authorized:

- provider: `deepseek`
- model requested: `deepseek-v4-flash`
- thinking: disabled
- input: only baseline/candidate observable payloads, neutrally labeled Experience A/B
- no retry without new Human authorization

## Acceptance

The single Story passes only if:

1. isolated baseline equals the sealed origin baseline;
2. baseline Phase 0 source fingerprint is clean against the synthetic baseline;
3. candidate differs from baseline by exactly the declared `general.json` change;
4. baseline and candidate run conditions are identical except runRef and the declared catalog/source change;
5. baseline/candidate observable pair is structurally matched and contains the expected one-text difference;
6. one and only one real comparative participant invocation completes;
7. raw provider/participant responses are preserved;
8. structured comparative response validates A/B references and contains no verdict/score fields;
9. Human review presents both experiences, mapping, feedback, provenance, subjective-opinion disclaimer, and STOP;
10. no second run pair, participant, promotion, auto PRD, or next iteration is executed.
