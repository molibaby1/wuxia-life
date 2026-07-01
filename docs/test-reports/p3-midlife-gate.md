# P3 Midlife Gate (US-024)

生成时间：2026-06-28T13:27:00.320Z

结果：**PASS**

## Thresholds

- midlife age range: **31–50**
- minimum route events per priority route: **3**
- minimum manual choices per priority route: **2**

## Priority-route samples

| Sample | Route | Final age | Alive | Midlife route events | Midlife manual choices |
| --- | --- | ---: | --- | ---: | ---: |
| golden-sect | sect | 50 | yes | 5 | 5 |
| golden-wanderer | wanderer | 50 | yes | 5 | 5 |
| golden-demonic | demonic | 50 | yes | 5 | 4 |

## Failures

_None — all priority-route midlife checks passed._

Regenerate: `npm run gate:midlife`
