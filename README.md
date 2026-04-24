**Agents can't act on what they can't perceive.**

World2Agent is an open protocol that connects the world to AI agents. It standardizes how agents perceive their surroundings — stock movements, meeting updates, new research papers, GitHub trending repos, X/Twitter feeds, and anything else that can emit a signal.

## Why World2Agent?

AI agents today are mostly reactive — they wait for user input, or have to actively search for information. A truly useful agent needs to proactively perceive its environment: a stock price hitting your threshold, a meeting agenda changing 10 minutes before it starts, a new paper dropping in your research area, a repo trending on GitHub that's relevant to your project.

Without a standard, every agent builder has to:

* Write bespoke integrations for each data source

* Design their own signal schema — none of which are interoperable

* Handle polling, webhooks, auth, dedup, backpressure from scratch

World2Agent makes perception pluggable. Install a sensor, get structured signals. Swap one sensor for another, your agent code doesn't change. Compose multiple sensors, they all speak the same schema. Standardized, open, and pluggable — for perception.

* **Unified signal format** — one schema for all sources, designed for AI consumption

* **Pluggable sensors** — each sensor is an independent npm package; install only what you need

* **Pluggable delivery** — direct to agent, or enriched via a graph layer (self-hosted or third-party)

* **Pluggable transports** — stdout pipe, HTTP POST, or any custom transport

* **Zero lock-in** — run sensors yourself, compose them freely, no central server

We built the protocol and the first sensors. But these are just the starting point — the real breakthroughs will come from the community.

## Architecture

**World → Sensor → Agent**

Sensors watch data sources and emit structured signals following W2A Protocol — a unified signal schema designed for AI consumption. Your agent receives signals and decides what to do.

The protocol defines what a signal looks like. Sensors do the work. Agents make the decisions.

This is the core loop — and it's all you need to get started.

## Roadmap

As your needs grow, W2A supports more advanced patterns:

* **Graph layer** — compose and enrich signals from multiple sensors before they reach your agent. Run it yourself, or use a hosted service. Graph input and output both follow W2A Protocol, so it slots in without changing your agent code.

* **SensorHub** — an open registry where anyone can publish, discover, and install sensors from the community. Think npm, but for real-world perception.

These are on the roadmap. The protocol and the first sensors are ready today.

![World2Agent system architecture](./docs/images/system-architecture.png)

## Packages

> [**SDK Reference →**](https://github.com/machinepulse-ai/world2agent-typescript-sdk) Full API documentation for sensor developers and signal consumers.

***

## Signal Format

Every signal follows a unified schema:

```typescript
{
  signal_id: "uuid-v4",
  schema_version: "w2a/0.1",
  emitted_at: 1719000000000,
  source: {
    sensor_id: "<package-name>",
    sensor_version: "0.1.0",
    source_type: "slack",
    user_identity: "U01A2B3C4D",            // Slack id of the user this sensor serves
    package: "<package-name>",              // canonical package coordinate; usually = sensor_id
  },
  event: {                                  // normalized cross-source classification
    type: "messaging.message.mentioned",    // domain.entity.action
    occurred_at: 1719000000000,
    summary: "Zhang Wei asked about payment deployment safety in #engineering; staging error rate spiked 2h ago, blocking release pipeline",
  },
  source_event: {                           // optional, self-describing original payload from the source
    schema: { /* JSON Schema draft-07 describing `data` */ },
    data:   { channel_id: "C01ENG0001", message_ts: "1719000000.001200", user_id: "U09Z8Y7X6W" },
  },
  attachments: [                            // optional, content blobs (tagged union on `type`)
    { type: "inline",    mime_type: "text/plain", description: "Original message text", data: "..." },
    { type: "reference", mime_type: "image/png",  description: "Error rate dashboard screenshot", uri: "https://..." },
  ],
}
```

Key design decisions:

* **`event.summary`** is the soul of the signal. An AI reading only the summary must be able to decide whether and how to act. Follow Actor-Action-Object-Context-Impact: *who did what, where, and why it matters*.

* **`event` vs `source_event`** — `event` is the normalized cross-source classification (`type` / `occurred_at` / `summary`). `source_event` is the self-describing original payload from the source platform (`schema` + `data`, both required when present). Keeping them separate lets agents pattern-match on `event.type` without knowing platform-specific shapes, while graph layers still get the full structured facts.

* **`attachments`** carry actual content blobs (message bodies, diffs, images, audio). Each item is a tagged union: `{ type: "inline", mime_type, description, data }` for embedded content, or `{ type: "reference", mime_type, description, uri }` for externally-addressable content. `description` is required on both so AI always understands what it's looking at. Not for structured metadata — that belongs in `source_event`.

* **No routing in protocol** — routing/priority is a consumer-side concern, not the sensor's.

***

## For Signal Consumers

Install the SDK and any sensor, get signals in a few lines:

```bash
npm install @world2agent/sdk @world2agent/sensor-slack
```

```typescript
import { run } from "@world2agent/sdk/sensor";
import { createSignalHandler } from "@world2agent/sdk/consumer";
import slack from "@world2agent/sensor-slack";

const handler = createSignalHandler();

handler.on("messaging.message.direct", async (signal) => {
  console.log("Direct message:", signal.event.summary);
  // Your agent logic here
});

handler.on("messaging.message.mentioned", async (signal) => {
  console.log("Mentioned:", signal.event.summary);
});

await run(slack, {
  config: { bot_token: "xoxb-..." },
  onSignal: (signal) => handler.handle(signal),
});
```

**Multi-sensor** -- compose sensors freely, they all speak the same schema:

```typescript
import { runAll } from "@world2agent/sdk/sensor";
import { fanout, stdoutTransport, httpTransport } from "@world2agent/sdk/transports";

await runAll([
  { spec: slack, config: { bot_token: "xoxb-..." } },
  { spec: gcal, config: { client_id: "xxx", client_secret: "xxx", refresh_token: "xxx" } },
], {
  onSignal: fanout([
    stdoutTransport(),
    httpTransport({ url: "https://your-app.com/api/signals" }),
  ]),
});
```

**Pipe mode** -- every sensor has a standalone CLI:

```bash
w2a-sensor-slack | your-consumer-app
```

***

## For Sensor Developers

Build a new sensor in \~50 lines:

```typescript
import { defineSensor } from "@world2agent/sdk/sensor";
import { createSignal } from "@world2agent/sdk";
import { z } from "zod";

export default defineSensor({
  id: "my-sensor",
  version: "0.1.0",
  source_type: "my-source",
  auth: { type: "api_key", fields: [{ name: "token", label: "API Token", sensitive: true }] },
  configSchema: z.object({ token: z.string() }),

  async start(ctx) {
    const interval = setInterval(async () => {
      const data = await fetchMySource(ctx.config.token);

      const signal = createSignal(this, {
        event: {
          type: "my-source.item.created",
          summary: `${data.author} created "${data.title}" in ${data.project}; priority ${data.priority}, assigned to you`,
        },
        source_event: {
          schema: { type: "object", properties: { id: { type: "string" }, priority: { type: "number" } } },
          data:   { id: data.id, priority: data.priority },
        },
        attachments: [
          { type: "inline", mime_type: "text/plain", description: "Item description", data: data.body },
        ],
      });

      await ctx.emit(signal);
    }, 60_000);

    return () => clearInterval(interval); // cleanup
  },
});
```

***

## License

Apache 2.0
