# P7 Choice Tradeoff Metadata (US-027)

## Metadata fields

| Field | Meaning |
| --- | --- |
| reward | Expected stat/flag gains (ranges OK) |
| cost | Direct resource spend or stat loss |
| risk | low / medium / high — disturbance or failure likelihood |
| opportunityCost | What you give up this period (time, alternate action) |

## Unacceptable patterns

- One option strictly better on all channels (dominated choice)
- Hidden massive penalty with no UI hint
- Lock reason exposing raw expression syntax

## P7 minimum

Active actions expose reward/cost/risk summaries on choice labels. Story choices use `explainChoice` + optional event metadata when present.
