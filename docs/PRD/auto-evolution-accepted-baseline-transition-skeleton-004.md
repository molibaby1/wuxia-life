# PRD — Auto Evolution Skeleton 004: Experimental Accepted Baseline Transition

> 状态：CLOSED / Human accepted（2026-08-15 corrective Human final review PASS）
>
> 首次 evidence：REJECTED（formatting delta）；historical evidence retained。
> 不授权 origin promotion / Auto PRD / 下一 Skeleton。

## Goal

Prove one Human-preauthorized experimental candidate can become an exact clean new baseline, and prove the next real Phase 0 run starts from that baseline.

## Authority

This PRD is subordinate to:

`docs/product/auto-evolution-model.md` and `docs/governance/current-product-stage.md`

If this PRD, its paired JSON, or runtime inference disagree, authority is:

`auto-evolution-model + current-product-stage > PRD.md > prd.json > runtime inference`.

## Human preauthorization

Human acceptance of the design preauthorizes Candidate C as an **Experimental Accepted Baseline** only if C is mechanically proven to equal sealed baseline B plus exactly the declared modification below, with deterministic checks passing and no additional source delta.

This does not authorize origin promotion.

## Human-authored modification

In the isolated candidate workspace only, append exactly this marker to `birth_wuxia_family.content.text` in `src/data/lines/general.json`:

` AE-SKELETON-004`

Do not write the marker into the Human origin product source.

## Fixed next-run inputs

- persona: `p8-martial-lin`
- seed: `101`
- endAge: `2`
- maxSteps: `120`
- catalogVersion: `ae-skeleton-004-transition-v1`
- runRef: `ae-skeleton-004-next-baseline`

Exactly one next-baseline Phase 0 run is authorized after the transition proof prerequisites pass.

## Acceptance

The single Story passes only if:

1. a complete sealed baseline B is exact-copied into an isolated workspace without rewriting Human origin Git state;
2. synthetic starting baseline Git represents the complete sealed source set and is clean;
3. Candidate C differs from B only by the declared `general.json` marker append;
4. `npm run typecheck` and `npx tsx tests/evolution/runPhase0Tests.ts` pass for C;
5. Human preauthorization conditions are mechanically satisfied;
6. C is committed in the isolated synthetic repository as new baseline B2;
7. complete source manifests prove `C == B2` and B2 worktree is clean;
8. exactly one Phase 0 run executes from B2 using the fixed accepted inputs;
9. Phase 0 fingerprint proves `headSha == B2` and zero worktree entries;
10. a post-run source manifest proves source bytes still equal B2;
11. sealed catalog and player-observable payload each contain `AE-SKELETON-004` exactly once at the intended birth event;
12. Phase 0 hashes/anchor close correctly and origin source remains marker-free;
13. Human review evidence is produced and execution STOPs without auto PRD, promotion, participant call, or next iteration.
