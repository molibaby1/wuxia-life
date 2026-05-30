# P3 Midlife — Deterministic Simulation Segments (US-017)

生成时间：2026-05-30T18:21:44.853Z

终点年龄：**50**；评估队列：golden-sect, golden-wanderer, golden-demonic, golden-neutral-baseline, golden-romance-family

## 分段指标说明

| 分段 | 年龄 | 必填字段 |
| --- | --- | --- |
| Youth | 0–30 | event/choice 计数、route state、simulated payoff |
| Midlife | 31–50 | 同上 + relationship state、death status、payoff status |

## 样本汇总

| Sample | Route | Final age | Alive | Youth | Midlife |
| --- | --- | ---: | --- | --- | --- |
| golden-sect | sect | 50 | yes | events=31, choices=11, payoff=100%, alive=true | events=19, choices=13, payoff=100%, alive=true |
| golden-wanderer | wanderer | 50 | yes | events=31, choices=16, payoff=100%, alive=true | events=19, choices=13, payoff=100%, alive=true |
| golden-demonic | demonic | 50 | yes | events=31, choices=10, payoff=100%, alive=true | events=19, choices=12, payoff=100%, alive=true |
| golden-neutral-baseline | neutral | 50 | yes | events=31, choices=13, payoff=100%, alive=true | events=19, choices=12, payoff=100%, alive=true |
| golden-romance-family | neutral | 50 | yes | events=31, choices=13, payoff=100%, alive=true | events=19, choices=11, payoff=100%, alive=true |

## Midlife (31–50) 明细

### golden-sect

| 字段 | 值 |
| --- | --- |
| eventCount | 19 |
| choiceCount | 13 |
| routeState | demonic:inactive; beggars:inactive; official:inactive; sect:active |
| routeFlags | route_orthodox |
| relationshipState | spouse=明月, children=1, arc=completed |
| deathStatus | alive=true, diedInSegment=false, reason=— |
| payoffStatus | rate=100.0%, hits=2/2, pass=true |

### golden-wanderer

| 字段 | 值 |
| --- | --- |
| eventCount | 19 |
| choiceCount | 13 |
| routeState | demonic:inactive; sect:inactive; beggars:inactive; wanderer:active |
| routeFlags | route_wanderer |
| relationshipState | spouse=明月, children=1, arc=completed |
| deathStatus | alive=true, diedInSegment=false, reason=— |
| payoffStatus | rate=100.0%, hits=0/0, pass=true |

### golden-demonic

| 字段 | 值 |
| --- | --- |
| eventCount | 19 |
| choiceCount | 12 |
| routeState | sect:inactive; beggars:inactive; official:inactive; demonic:completed |
| routeFlags | route_demonic, route_demonic_completed |
| relationshipState | spouse=明月, children=1, arc=completed |
| deathStatus | alive=true, diedInSegment=false, reason=— |
| payoffStatus | rate=100.0%, hits=0/0, pass=true |

### golden-neutral-baseline

| 字段 | 值 |
| --- | --- |
| eventCount | 19 |
| choiceCount | 12 |
| routeState | sect:active |
| routeFlags | route_orthodox |
| relationshipState | spouse=明月, children=1, arc=completed |
| deathStatus | alive=true, diedInSegment=false, reason=— |
| payoffStatus | rate=100.0%, hits=2/2, pass=true |

### golden-romance-family

| 字段 | 值 |
| --- | --- |
| eventCount | 19 |
| choiceCount | 11 |
| routeState | demonic:active |
| routeFlags | route_demonic |
| relationshipState | spouse=明月, children=1, arc=completed |
| deathStatus | alive=true, diedInSegment=false, reason=— |
| payoffStatus | rate=100.0%, hits=0/0, pass=true |

Regenerate: `npm run simulate:p3-eval`
