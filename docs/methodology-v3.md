# Methodology v3 (November 2026)

What the site measures since 2026-11-07, and what changed from v1 (the runs of Aug–Sep 2026).

## Same

- The same 30 merged PRs from cal.com, Discourse, Grafana, Keycloak and Sentry (TypeScript, Ruby, Go, Java, Python).
- Every model runs inside the Kodus review harness, at vendor-default reasoning, one run per entry.
- Micro-averaged metrics and a 95% bootstrap interval on recall (resampling PRs).

## Changed

| | v1 | v3 |
|---|---|---|
| Ground truth | Martian goldens: 95 human-reported bugs | Gold v3: the real problems in each PR re-labelled by Kodus (Opus plus a second reviewer, debated where they disagreed): 121 valid true positives |
| Judge | Claude Haiku 4.5 | Claude Haiku 5.5, validated against Claude Opus 5.5 (agreed on 249 of 252 comments) |
| Match rule | finding describes the same issue as a golden | same problem at the same place; each valid TP counts once, a second comment on it is a false positive |
| Review modes | one | two per model: **balanced** (one generalist agent) and **heavy** (generalist + 9 specialist lens agents in parallel, then the same verify/dedup steps) |
| Ranking | F1 | **F2** = 5·P·R / (4·P + R), recall weighted twice precision; ranked within each mode |
| Cost | tokens × list price, no cache discount; subscription runs had no cost | tokens × list price **with prompt cache** |
| Models | 15 (Aug–Sep 2026 roster) | 13: DeepSeek V4 Pro, DeepSeek V4.1 Flash, Kimi K3.1 Pro, GLM-5.3, GLM-5.3 Flash, MiniMax M3, Gemini 3.8 Flash, Muse Spark 1.2, GPT-6.1 Sol, GPT-6 Luna, Claude Sonnet 5.5, Claude Opus 5.5, Qwen3.8 27B (AkashML) |

## Metrics

- **Recall** = valid TPs found / 121.
- **Precision** = published comments matching a valid TP / all published comments.
- **F1** = harmonic mean of P and R.
- **F2** = F-score with beta = 2 (popularized for code review by Martian's benchmark). A missed bug costs more than a comment you dismiss.

## Cost

Per run, with `inputTokens` including cached tokens and reasoning tokens already inside `outputTokens`:

```
cost = (input − cacheRead − cacheWrite) · inputPrice
     + cacheRead · cacheReadPrice
     + cacheWrite · (cacheWritePrice ?? inputPrice)
     + output · outputPrice
```

Prices in `pricing.json`, read from each vendor's official page on 2026-11-07, Opus 5.5 and Qwen3.8 27B on 2026-11-09 (URL per model). Caveats shown on the site where cost appears:

- DeepSeek is priced at its standard (peak) rate; off-peak is half.
- Gemini 3.8 Flash is at its promotional price, valid until 2026-12-31.
- GPT models are priced at OpenAI list price, short-context tier.

## Known limits

- One run per model and mode. Re-judging the same output moved a model's score by at most one matched bug (under 1 point of recall); resampling the 30 pull requests moves it by about 20 points (95% bootstrap interval).
- GPT-6 Luna ran at the vendor's default reasoning effort, which reasons very little on this task (about 25 reasoning tokens per pull request).
- A review whose model calls failed in transport (rate limit, lost connection) was set aside and run again; those dumps are kept as incidents in the run repository. Calls aborted by the product's own timeouts were kept: a customer on a slow model gets the same.

## Dropped from v1

Not present in the v3 data, so removed from the site rather than estimated: fair recall, loop fidelity, the realMiss/artifact/untestable classification of missed bugs, judge run-to-run variance runs, and the paired test against the top model.

## Data and pipeline

```
data-v3/scorecards/{light,heavy}/<modelId>.json          # light = balanced
data-v3/submissions/{light,heavy}/<modelId>.submission.json
node process-scorecards.js && node scripts/generate-badges.js
```

`process-scorecards.js` takes whatever is in those folders; a model with only one mode renders with the other marked "not run yet". The v1 scorecards, submissions and `goldens.json` were removed from the tree and remain in git history.

The blog posts were written on v1 and keep their numbers, with a dated note pointing to the current leaderboard.
