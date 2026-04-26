# RFC: Graph Layer

> Status: Roadmap — not yet implemented

## Problem

Single sensors provide atomic signals. But real-world perception often requires crossing multiple sources — "you have a free evening + a restaurant you like just opened a new menu + the weather is nice" isn't any one sensor's output.

## Proposal

A graph layer that sits between sensors and agents, composing and enriching signals from multiple sources before they reach the agent.

### Key Constraint

**Graph output stays W2A Protocol.** The graph is technically middleware — it consumes W2A signals and emits W2A signals. This means:

- Agent code doesn't change when you add a graph
- You can swap between direct path and graph path without touching the agent
- Graphs are composable — one graph can feed another

### Deployment Options

- **Self-hosted** — agent owner runs their own instance. Data stays local.
- **Third-party** — hosted service (e.g. Karpo). Zero ops, trade-off is data passes through a third party.

### Architecture

```
Sensors ──────────────┐
  │                   │
  ▼                   ▼
Agent            Graph layer
(direct)     (compose, enrich, filter)
                      │
                      ▼
                    Agent
```

## Open Questions

1. How does a graph define its composition logic? Config file? Code? Natural language?
2. Should graphs be publishable on SensorHub alongside sensors?
3. How to handle backpressure when a graph consumes high-frequency sensors?
4. Should graphs be able to call external APIs (e.g. LLM for enrichment), or stay pure data transformations?

## Status

This is on the roadmap. The protocol and sensors are the current priority. Community input welcome — open a [Discussion](https://github.com/machinepulse-ai/world2agent/discussions) if you have thoughts on graph design.
