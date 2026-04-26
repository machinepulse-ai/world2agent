# Architecture

## Core Loop

**World → Sensor → Agent**

Sensors watch data sources and emit structured data following W2A Protocol — a unified signal schema designed for AI consumption. Your agent receives signals and decides what to do.

The protocol defines what a signal looks like. Sensors do the work. Agents make the decisions.

```
World (Flights API, Calendar, GitHub, X, Steam, ...)
  │
  ▼
Sensors (npm packages, emitting W2A-formatted data)
  │
  ▼
Agent (receives signals, reasons, acts)
```

This is the core loop — and it's all you need to get started.

## Key Design Decisions

1. **Protocol is natural-language-first** — designed for agents, not humans
2. **Sensors don't make value judgments** — they provide controllable granularity of listening and subscription
3. **Sensors don't assume where they run** — consumers define how sensors emit via transports
4. **Graph output stays W2A Protocol** — technically acts as middleware

## Sensor

A sensor is a small program that watches one data source and emits structured data following W2A Protocol. Each sensor is an independent npm package.

Sensors support multiple delivery methods:
- **stdout pipe** — `w2a-sensor-github | your-agent`
- **HTTP POST** — push to an endpoint
- **WebSocket / SSE** — streaming delivery
- **Custom transport** — implement your own

A sensor does NOT:
- Route or prioritize signals (that's the consumer's job)
- Define actions (that's the agent's job)
- Assume a specific agent runtime

## SensorHub

SensorHub is a discovery layer on top of npm. Every sensor is a standard npm package — SensorHub makes them easier to find.

```
Developer builds sensor → npm publish → submit to SensorHub
                                              │
User searches SensorHub → finds sensor → npm install
```

No separate registry. npm is the single source for hosting and distribution.

## Graph Layer (Roadmap)

As needs grow, W2A supports an intermediate graph layer that composes and enriches signals from multiple sensors before they reach the agent.

```
World
  │
  ▼
Sensors ──────────────┐
  │                   │
  ▼                   ▼
Agent            Graph layer
(direct)     (compose, enrich, filter)
                      │
                      ▼
                    Agent
```

Graph deployment options:
- **Self-hosted** — agent owner runs their own instance, data stays local
- **Third-party** — hosted service (e.g. Karpo), zero ops

Graph input and output both follow W2A Protocol, so it slots in without changing agent code.

## Full Architecture

```
┌─────────────────────────────────────────────────────────┐
│  World                                                  │
│  Flights API · Calendar · GitHub · X · Steam · ...      │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Sensors (following W2A Protocol)                [Today]│
│  github · x · steam · gcal · feishu · hn · ...          │
│                                                         │
│  ←→ SensorHub (discover, publish, install)       [Today]│
└──────────┬───────────────────────────┬──────────────────┘
           │                           │
      Direct path               Graph path [Roadmap]
           │                           │
           │              ┌────────────▼────────────────┐
           │              │  Graph layer                │
           │              │  ┌─ Self-hosted             │
           │              │  └─ Third-party (e.g. Karpo)│
           │              └────────────┬────────────────┘
           │                           │
           └───────────┬───────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Agent                                                  │
│  Receives signals, reasons, acts                        │
└─────────────────────────────────────────────────────────┘
```
