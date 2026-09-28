# INSIGHTS.md

## Three Insights from the LILA BLACK Data

---

## Insight 1: Grand Rift is a Ghost Town — 7% of Matches vs 71% on Ambrose Valley

### What caught my eye
Filtering by map in the tool makes this immediately obvious: Grand Rift has almost no traffic. The match list stays nearly empty while Ambrose Valley is packed.

### The numbers
| Map | Matches | % of total | Total kills | Loot events |
|-----|---------|-----------|------------|-------------|
| AmbroseValley | 566 | **71%** | 1,799 | 9,955 |
| Lockdown | 171 | 21% | 426 | 2,050 |
| GrandRift | 59 | **7%** | 193 | 880 |

Grand Rift has **10× fewer matches** than Ambrose Valley over the same 5-day period, and only 3.5× fewer than Lockdown despite being a full-sized map.

### What's actionable
- **Metric affected:** Map rotation health, player retention per map, session length
- **Actionable items:**
  1. Investigate whether Grand Rift is underweighted in the matchmaking rotation or if players are actively avoiding/leaving it
  2. Use the heatmap overlay (Traffic layer) on Grand Rift in the tool — the low-density zones reveal which areas players never reach, pointing to layout problems (dead ends, poor flow, unclear objectives)
  3. Run an exit survey or look at early-quit rates on Grand Rift vs. the other maps

### Why a level designer should care
If Grand Rift's layout is causing players to avoid the map, design changes (better landmarks, clearer flow, richer loot density) could be targeted at the exact zones the traffic heatmap shows as empty. The tool makes this visible in one click.

---

## Insight 2: Only 3 Human-vs-Human Kills in 5 Days — This is Almost Entirely a PvE Game

### What caught my eye
Switching on the Kill/Death event markers in the tool and filtering for `Kill` (human kills human), I noticed almost no orange star markers anywhere. The event log shows:

| Event | Count |
|-------|-------|
| BotKill (human killed bot) | 2,415 |
| Kill (human killed human) | **3** |
| BotKilled (human killed by bot) | 700 |
| Killed (human killed by human) | **3** |

### The numbers
- **PvP kills = 3 total** across 796 matches and 5 days
- **PvE kills = 2,415** (human → bot)
- **Bot threat is real:** 700 humans were killed by bots — bots kill humans 233× more often than humans kill each other

### What's actionable
- **Metric affected:** PvP engagement rate, lobby fill quality, session competitiveness
- **Actionable items:**
  1. Check if human player density per match is the root cause — with an average of **1.56 players per match** and **743 out of 796 matches having only 1 human player**, PvP is structurally impossible most of the time. Fix matchmaking to fill lobbies before the design is blamed.
  2. If lobby fill improves and PvP is still low, investigate whether players are avoiding conflict (extraction shooter risk aversion) — add high-value extraction zones that force player convergence
  3. The Kill heatmap in the tool can pinpoint the 3 PvP kill locations — design a high-traffic objective or landmark near those coordinates to validate whether that area naturally draws confrontation

### Why a level designer should care
You can't tune encounter design around PvP if there's no PvP happening. But the tool reveals this is a **matchmaking/population problem**, not a layout problem — the 3 kills that *did* happen are all in plausible high-traffic zones. That's useful signal: the map geometry isn't broken, the lobbies are too empty.

---

## Insight 3: Loot Density is Mismatched to Player Traffic — Some Areas are Over-Served

### What caught my eye
Toggling between the **Traffic heatmap** and the **Loot Hotspots heatmap** on Ambrose Valley, the two layers don't overlap cleanly. There are loot-dense areas with very little foot traffic, and high-traffic corridors with sparse loot markers.

### The numbers
- **12,885 total Loot events** across all maps
- Loot events make up **14.5%** of all events (behind only Position/BotPosition movement)
- Ambrose Valley loot: **9,955** — but concentrated in the early match window (players loot heavily, then movement events thin out as the storm pushes)
- Human position events: **51,347** vs Bot position: **21,712** — bots occupy roughly **30% of map presence** despite being AI

### What's actionable
- **Metric affected:** Average loot collected per match, time-to-first-engagement, player routing decisions
- **Actionable items:**
  1. Use the tool's dual-heatmap comparison (switch between Traffic and Loot layers) to find loot spawns in zero-traffic zones — those are wasted items that no player reaches before the storm
  2. Relocate or increase loot density along the natural storm-exit corridors (visible in the tool as the high-traffic bands where players funnel toward extraction)
  3. Track loot pickup rate vs. spawn count per zone — if loot events cluster only in the first 20% of match duration (visible by scrubbing the timeline), late-game zones are starved and players have no reason to go there

### Why a level designer should care
Loot placement drives routing decisions. If the tool shows players never reaching loot in the eastern quadrant of Ambrose Valley, you either move the loot to where players go — or add an objective that pulls players into that zone. The timeline scrubber in the tool lets you watch *when* loot is picked up, which tells you whether it's early-rush loot or late-game strategic loot.
