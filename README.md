![Welcome to World2Agent](https://private-user-images.githubusercontent.com/16631496/583882105-c724ab40-4f94-478e-b4c6-1c936e9a5677.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NzcyMTYxMDAsIm5iZiI6MTc3NzIxNTgwMCwicGF0aCI6Ii8xNjYzMTQ5Ni81ODM4ODIxMDUtYzcyNGFiNDAtNGY5NC00NzhlLWI0YzYtMWM5MzZlOWE1Njc3LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjA0MjYlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwNDI2VDE1MDMyMFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWJlOTBkYWRiNGU1MmM1MDRmYjQ1NjE4YjlmMTg2OGZkYTNhYjgwMzcyNjc4ZDg0NTQ1ZDdmMzIxOTMyNTU0MTQmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtdHlwZT1pbWFnZSUyRnBuZyJ9.lavbwz7h-tvI-ac2pCs_8EiPz44nCoQWqLzYL-lP5OA)

<p align="center">
  <i>Agents can't act on what they can't perceive.</i>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License" /></a>
  <a href="https://www.npmjs.com/org/world2agent"><img src="https://img.shields.io/badge/npm-%40world2agent-red" alt="npm" /></a>
</p>

<p align="center">
  <a href="https://world2agent.ai">Website</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#sensors">Sensors</a> ·
  <a href="https://world2agent.ai/hub">SensorHub</a> ·
  <a href="./docs">Docs</a> ·
  <a href="#community">Community</a>
</p>

<!-- Concept Video -->
<p align="center">
  <a href="https://world2agent.ai/assets/promo-w2a.mp4">
    Watch the W2A Concept Video
  </a>
</p>

<p align="center">
  <img src="https://private-user-images.githubusercontent.com/16631496/583881866-3da904c0-914b-4b5a-a818-768eebb75598.gif?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NzcyMTU5NTAsIm5iZiI6MTc3NzIxNTY1MCwicGF0aCI6Ii8xNjYzMTQ5Ni81ODM4ODE4NjYtM2RhOTA0YzAtOTE0Yi00YjVhLWE4MTgtNzY4ZWViYjc1NTk4LmdpZj9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjA0MjYlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwNDI2VDE1MDA1MFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTc5ZGIyNjY0MzQ2NGM4OTM3YjAwMTdjYjZiOTNkZjQ3OTYyMDUyNjM2MzM1OTZhYzc1OGEzNTU4YzAzZjUxZGImWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtdHlwZT1pbWFnZSUyRmdpZiJ9.JZPOSeaPAGwuAytD80mS2Z642LzgADPggbi0JBam35w" width="600" alt="star" />
</p>

***

## What is World2Agent?

World2Agent (W2A) is an open protocol that standardizes how AI agents perceive the real world. Install a sensor, your agent gets structured, real-time data. Swap sensors freely — they all speak the same schema.

W2A isn't a product. It's an open protocol and an invitation. We built the first sensors — the real breakthroughs will come from the community.

→ [Why W2A? Full story](./docs/why-w2a.md)

## Architecture

**World → Sensor → Agent**

Sensors watch data sources and emit structured data following W2A Protocol. Your agent receives signals and decides what to do.

![World2Agent system architecture](./docs/images/system-architecture.png)

→ [Signal format spec](./docs/signal-format.md) · [Architecture deep dive](./docs/architecture.md)

## Quick Start

The fastest way to feel W2A is with Claude Code. In an active session, install the `world2agent` plugin:

```
/plugin marketplace add machinepulse-ai/world2agent-plugins
/plugin install world2agent@world2agent-plugins
/reload-plugins
```

Add a sensor — for example, Hacker News:

```
/world2agent:sensor-add @world2agent/sensor-hackernews
```

Restart Claude Code with the plugin channel loaded so sensor signals flow into your session:

```bash
claude --dangerously-load-development-channels plugin:world2agent@world2agent-plugins
```

> **Security — install only sensors you trust.** A sensor's signals drive what your agent perceives and does, so an untrusted sensor is effectively an untrusted instruction source. Stick to open-source sensors from authors you trust, and review the code first.

Or pipe directly to any agent runtime — no plugin needed:

```bash
w2a-sensor-hackernews | your-agent
```

**Building your own agent?** See the [developer quick start](./docs/quick-start.md#option-2-code--sdk--sensor) for the SDK code path.

→ [Full guide](./docs/quick-start.md) · [Multi-sensor](./docs/multi-sensor.md) · [SensorHub](./docs/sensorhub.md)

## Sensors

### SensorHub

Every sensor is a standard npm package. SensorHub is the discovery layer on top — browse the catalog at [world2agent.ai/hub](https://world2agent.ai/hub), or search npm directly:

```bash
npm search w2a-sensor
npm install @world2agent/sensor-hackernews
```

→ [SensorHub guide](./docs/sensorhub.md)

### Missing a sensor?

[Build your own](./docs/build-a-sensor.md) in ~50 lines. The `build-w2a-sensor` skill walks an AI coding agent through discovery, signal design, scaffolding, and the install recipe.

Once it's ready, ship it to npm:

```bash
npm publish
```

That's all it takes to share your sensor with the world — once published, it's installable by every W2A agent everywhere, and SensorHub indexes it for discovery.

## Roadmap

* **Graph layer** — compose and enrich signals from multiple sensors before they reach your agent. → [RFC](./docs/rfc-graph.md)

## Contributing

* 🔧 **Build a sensor** — `npm publish` and it's live

* 🐛 **Report bugs** — [open an issue](https://github.com/machinepulse-ai/world2agent/issues)

* 💡 **Suggest a sensor** — [Discussions](https://github.com/machinepulse-ai/world2agent/discussions)

→ [Contributing guide](./docs/CONTRIBUTING.md)

## Community

[Website](https://machinepulse.ai/) · [X / Twitter](https://x.com/MachinePulse_AI) · [YouTube](https://www.youtube.com/channel/UCmuDMSxQp2LLJ4nrkPuCGQw)

<!-- Star History — uncomment after launch -->
<!-- [![Star History Chart](https://api.star-history.com/svg?repos=machinepulse-ai/world2agent&type=Date)](https://star-history.com/#machinepulse-ai/world2agent&Date) -->

## License

[Apache 2.0](./LICENSE)

***

<p align="center">
  Built by <a href="https://machinepulse.ai">MachinePulse</a> · Open source, open protocol, open invitation.
</p>
