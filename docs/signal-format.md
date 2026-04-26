# Signal Format

Every sensor emits the same envelope and every consumer accepts the same envelope — no sensor-specific shapes on the wire. The canonical schema lives in [`schema/0.1/schema.ts`](../schema/0.1/schema.ts) (with a generated [`schema.json`](../schema/0.1/schema.json) alongside it). Pin to the directory, never to `main`.

## Example

```json
{
  "signal_id": "8b1f0c4a-5d2e-4f87-9a1b-3c0e5f8a9d12",
  "schema_version": "w2a/0.1",
  "emitted_at": 1719000000123,

  "source": {
    "sensor_id": "@world2agent/sensor-github",
    "sensor_version": "0.1.0",
    "source_type": "github",
    "user_identity": "octocat",
    "package": "@world2agent/sensor-github"
  },

  "event": {
    "type": "repo.trending.entered",
    "occurred_at": 1719000000000,
    "summary": "llm-agents/perception gained 523 stars in 24h and hit #3 on GitHub Trending in AI; relevant to your active 'agent perception' research thread"
  },

  "source_event": {
    "schema": {
      "type": "object",
      "properties": {
        "repo": {
          "type": "string",
          "description": "Repository in `owner/name` form"
        },
        "stars_today": {
          "type": "integer",
          "description": "Stars gained in the last 24 hours"
        },
        "trending_rank": {
          "type": "integer",
          "description": "Position on GitHub Trending; 1 is top of the list"
        }
      },
      "required": ["repo", "stars_today"]
    },
    "data": {
      "repo": "llm-agents/perception",
      "stars_today": 523,
      "trending_rank": 3
    }
  },

  "attachments": [
    {
      "type": "inline",
      "mime_type": "text/plain",
      "description": "Repository README excerpt",
      "data": "Perception primitives for LLM agents…"
    },
    {
      "type": "reference",
      "mime_type": "image/png",
      "description": "Stars-over-time chart",
      "uri": "https://example.com/charts/llm-agents-perception.png"
    }
  ]
}
```

## Fields

### Envelope

| Field | Required | Notes |
|---|---|---|
| `signal_id` | yes | UUID v4. Fresh per emission, even for logically identical events — consumers dedupe on this. |
| `schema_version` | yes | `"w2a/0.1"`. Consumers MUST reject versions they don't understand. |
| `emitted_at` | yes | When the sensor emitted, UTC ms. Distinct from `event.occurred_at`. |
| `source` | yes | Who emitted and where the event came from. |
| `event` | yes | Normalized cross-source classification. |
| `source_event` | optional | Self-describing original payload from the source. |
| `attachments` | optional | Content blobs (text, images, audio, etc.). |
| `_meta` | optional | Vendor / experimental fields. Consumers MUST ignore unknown keys. Available on most objects. |

### `source`

`sensor_id` is the npm coordinate, `package` is what channels and bridges use to derive the agent-side handler id (typically equal to `sensor_id`). `source_type` is a coarse platform grouping (`github`, `cron`, `feishu`) shared across sensors of the same platform — it's an open set, no central registry.

### `event` — the soul of the signal

`event.summary` is what an AI reads first. If the summary alone is not enough to decide whether and how to act, the signal has failed.

Pattern: **Actor → Action → Object → Context → Impact**.

```text
[Actor] [Action] [Object] in [Context]; [Impact]
```

Examples:

- ✅ `"Zhang Wei asked about payment deployment safety in #engineering; staging error rate spiked 2h ago, blocking release pipeline"`
- ✅ `"llm-agents/perception gained 523 stars in 24h and hit #3 on Trending; relevant to your active research thread"`
- ❌ `"new event"` / `"PR update"` / `"price moved"` — vague, reject and rewrite.

`event.type` follows `domain.entity.action`:

| Example | Domain | Entity | Action |
|---|---|---|---|
| `repo.pull_request.opened` | repo | pull_request | opened |
| `messaging.message.mentioned` | messaging | message | mentioned |
| `market.quote.threshold_crossed` | market | quote | threshold_crossed |
| `calendar.event.updated` | calendar | event | updated |

`action` must be a **past-tense verb** (`opened`, `mentioned`, `threshold_crossed`), never a base form or gerund (`open` ❌, `opening` ❌). Signals describe things that already happened, and consumers read the triple as a sentence — past tense is what makes it a sentence.

Open namespace — sensors coin their own triples. Consumers pattern-match on this string, so the triples a sensor emits are part of its public contract; treat them as you would a public API.

`domain` is the **abstract source space** (`messaging`, `repo`, `market`, `calendar`), not the platform name. The platform identity already lives in `source.source_type` — keeping the two orthogonal is what lets one handler match the same semantic event across platforms: `handler.on("messaging.message.mentioned")` catches Slack, Discord, Lark, and Teams alike. A sensor for GitHub stars emits `repo.star.added` (with `source.source_type: "github"`), not `github.repo.starred`.

`event.occurred_at` is when the underlying event happened. If the source doesn't expose it, fall back to `emitted_at`.

### `event` vs `source_event` vs `attachments`

Three channels, three jobs — keep them separate.

| Field | Carries | Example |
|---|---|---|
| `event` | Normalized classification — `type`, `occurred_at`, `summary` | `type: "messaging.message.mentioned"`, summary text |
| `source_event` | Self-describing structured data: `{ schema, data }` with JSON Schema draft-07 | IDs, numbers, booleans, enums the graph or agent will reason over |
| `attachments` | Unstructured content blobs | Message body, PDF, screenshot, audio clip |

Every property in `source_event.schema` SHOULD carry a `description` — that is what makes the payload self-describing. A schema that only declares types (`{ "type": "integer" }`) leaves the consumer guessing what the value means; a schema with descriptions (`{ "type": "integer", "description": "Stars gained in the last 24 hours" }`) lets an agent reason about the data without sensor-specific knowledge.

Never put structured machine data in an attachment. Never put large blobs in `source_event.data`.

### `attachments` — tagged union

Each attachment is `InlineAttachment` or `ReferenceAttachment`, discriminated by `type`. `description` is required on both — AI must always know what it's looking at.

```json
{ "type": "inline",    "mime_type": "text/plain", "description": "…", "data": "…" }
{ "type": "reference", "mime_type": "image/png",  "description": "…", "uri":  "https://…" }
```

- `inline.data` — UTF-8 for text mime types, base64 for binary.
- Prefer `reference` for anything larger than a few KiB, or anything already addressable. Consumers fetch references on demand.

## Design notes

**No routing in protocol.** Routing and priority are consumer-side concerns. A sensor just emits; the consumer decides what matters. The same sensor feeds a Claude Code agent, a Slack bot, and a dashboard with zero changes.

**Versioning.** The schema directory name (`0.1`) is the protocol version. Breaking changes bump the directory; additive changes land in place. Consumers pin to the directory.

**Extensibility via `_meta`.** Most objects carry `_meta?: Record<string, unknown>` so implementations can attach experimental or vendor fields without protocol bumps. Consumers MUST ignore unknown `_meta` keys.
