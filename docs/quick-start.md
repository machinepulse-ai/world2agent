# Quick Start

W2A plugs into any agent that can consume structured signals. Pick the path that fits your setup.

> **Security — install only sensors you trust.**
>
> A sensor's signals drive what your agent perceives and does, so an untrusted sensor is effectively an untrusted instruction source. We strongly recommend installing only open-source sensors from authors you trust, and reviewing the code before running it.

## Option 1: Claude Code (recommended)

The fastest way to feel W2A. In an active Claude Code session, install the `world2agent` plugin:

```
/plugin marketplace add machinepulse-ai/world2agent-plugins
/plugin install world2agent@world2agent-plugins
/reload-plugins
```

Add a sensor — for example, Hacker News:

```
/world2agent:sensor-add @world2agent/sensor-hackernews
```

Restart Claude Code with the plugin channel loaded so sensor signals can be delivered into your session:

```bash
claude --dangerously-load-development-channels plugin:world2agent@world2agent-plugins
```

Browse the full sensor catalog at [world2agent.ai/hub](https://world2agent.ai/hub).

## Option 2: Code — SDK + Sensor

For agents you're writing yourself. Install the SDK and a sensor:

```bash
npm install @world2agent/sdk @world2agent/sensor-github
```

Start receiving signals:

```typescript
import { run } from "@world2agent/sdk/sensor";
import { createSignalHandler } from "@world2agent/sdk/consumer";
import github from "@world2agent/sensor-github";

// 1. Create a handler — an event router for incoming signals
const handler = createSignalHandler();

// 2. Register listeners for each event type you care about
//    `domain` is the abstract source space (`repo`), not the platform name —
//    the platform identity is in `signal.source.source_type`.
handler.on("repo.trending.entered", async (signal) => {
  console.log("Trending:", signal.event.summary);
  // Your agent logic here
});

handler.on("repo.repo.starred", async (signal) => {
  console.log("New star:", signal.event.summary);
});

// 3. Run the sensor — signals flow in, your agent decides what to do
await run(github, {
  config: { token: "xxx" },
  onSignal: (signal) => handler.handle(signal),
});
```

## Option 3: CLI Pipe — any agent runtime

Every sensor is also a standalone CLI. Pipe it directly to your agent:

```bash
w2a-sensor-github | your-agent
```

No SDK, no TypeScript, no setup. The sensor emits W2A-formatted JSON to stdout, your agent reads stdin. More first-class agent integrations are on the way; until then this is how any runtime can consume W2A.

## Next Steps

- Browse available sensors → [Sensor Library](../README.md#sensors)
- Find community sensors → [SensorHub](./sensorhub.md)
- Build your own → [Build a Sensor](./build-a-sensor.md)
- Compose multiple sensors → [Multi-Sensor Composition](./multi-sensor.md)
