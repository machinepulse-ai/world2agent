# @world2agent/sensor-github-trending

A [W2A](https://world2agent.ai) sensor that emits a periodic digest of trending repositories on https://github.com/trending.

- **Source:** github.com/trending (public HTML, no auth)
- **Cadence:** `daily` or `weekly` (default `weekly`)
- **Signal type:** `repo.trending.refreshed`
- **Shape:** one digest signal per cycle, containing the top N repos in `source_event.data.repos` plus a pre-formatted markdown digest as the first attachment.

## Install

In Claude Code:

```
/world2agent:sensor-add @world2agent/sensor-github-trending
```

The install flow runs the [`SETUP.md`](./SETUP.md) Q&A — three defaulted questions for cadence / top_n / dedupe.

## Standalone CLI

```bash
npm install -g @world2agent/sensor-github-trending
W2A_CONFIG='{"cadence":"weekly","top_n":10}' w2a-sensor-github-trending
```

Each emit is a JSON-encoded `W2ASignal` written to stdout.

## Config

| Field                  | Default    | Notes                                                    |
| ---------------------- | ---------- | -------------------------------------------------------- |
| `cadence`              | `"weekly"` | `"daily"` or `"weekly"`                                  |
| `top_n`                | `10`       | 1–25                                                     |
| `dedupe_within_cycles` | `0`        | Skip repos seen in the last N digests; `0` = always send |

## License

Apache-2.0
