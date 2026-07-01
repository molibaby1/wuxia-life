# P45 Early Choice To Outcome Trace

Generated: 2026-06-25

## Scope

This trace documents whether early shaping intent can be followed forward into later trajectory evidence.

It uses a curated evidence path instead of raw replay dumps.

## Trace Slice A: Martial / `p8-martial-lin`

### Early shaping push

- intended push: repeated training preference
- matrix expectation: `trainingHabit` accumulation and martial-route identity

### State accumulation evidence

- age 10: no dominant shaping line yet
- age 20: dominant axis becomes `习武塑形 · 渐成`

### Later outcome evidence

- age 20: route signal becomes `正道门派`
- age 40: dominant axis reaches `习武塑形 · 定势`
- final life-memory first entry remains `习武塑形 · 定势`

### Trace verdict

**Trace holds**

This is still the clearest sample where early shaping push, accumulated axis, route signal, and final recap are aligned.

## Trace Slice B: Scholarly / `p8-scholar-su`

### Early shaping push

- intended push: repeated study preference
- matrix expectation: `studyHabit` accumulation and scholar-led identity

### State accumulation evidence

- age 10: no dominant shaping line yet
- age 20: dominant axis is still `习武塑形 · 成形`

### Later outcome evidence

- age 30: `scholar_path_started`
- age 30: `p21_study_echo_callback`
- age 40: `p27_mentor_obligation_consequence`
- final life-memory entries are `习武塑形 · 成形` + `营生塑形 · 成形`

### Trace verdict

**Trace partially holds, then breaks**

What holds:

- later scholar-specific callbacks do exist

Where it breaks:

- the main shaping axis never rotates to study-led dominance
- later scholar consequences are layered on top of a training-led life with an unexpected livelihood secondary line rather than a clear study-led trajectory

Break point:

- by age 20, intended study shaping is already losing the top-axis race

## Trace Slice C: Business / `p8-wealth-shen`

### Early shaping push

- intended push: repeated business preference
- matrix expectation: `businessHabit` accumulation and livelihood/merchant consequence pattern

### State accumulation evidence

- age 10: no dominant shaping line yet
- age 20: dominant axis reads `习武塑形 · 渐成`

### Later outcome evidence

- age 20: route shifts to `魔道`
- age 30 and 40: `营生塑形 · 渐成` appears as a secondary shaping line
- age 30 and 40: still no visible business callback in the replay summary
- final life-memory entries are `习武塑形 · 渐成` + `营生塑形 · 渐成`

### Trace verdict

**Trace partially holds, but too late**

What exists:

- route divergence exists
- late livelihood shaping residue now exists

What is missing:

- no visible business-led top shaping axis
- no visible business callback or obligation signal in the compact replay output
- final recap remains training-dominant in first position

Break point:

- business shaping intent is not visible as a top axis by age 20, and only appears as a secondary line later

## Trace Slice D: Mixed / `p8-balanced-wei`

### Early shaping push

- intended push: balanced action spread with no immediate single-axis collapse
- matrix expectation: top-2 shaping axes or a blended trajectory

### State accumulation evidence

- age 10: no dominant shaping line yet
- age 20: dominant axis reads `习武塑形 · 成形`
- age 30: dominant axis reads `习武塑形 · 定势`

### Later outcome evidence

- route remains `中立门派`
- no visible consequence signal by age 30 or 40
- by age 40, `营生塑形 · 渐成` appears as a secondary line
- final life-memory entries are `习武塑形 · 定势` + `营生塑形 · 渐成`

### Trace verdict

**Trace partially holds, but still collapses**

The mixed persona no longer ends as a pure single-axis training path, but it still does not preserve a blended top-axis growth line.

Break point:

- training dominance is already established by age 20, and later diversification never becomes primary

## Overall Traceability Verdict

Across the four baseline directions:

- one sample clearly holds
- one sample partially holds but breaks at the axis layer
- two samples now show late secondary recovery, but still fail to become top-axis divergence

This means P45 currently has:

- local causal proof for training-led shaping
- partial callback proof for scholar-led shaping
- partial late recovery for livelihood and mixed shaping

That is still not enough to claim whole-matrix causal validation yet.
