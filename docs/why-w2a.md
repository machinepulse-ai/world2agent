# Why World2Agent?

AI agents today are mostly reactive — they wait for user input, or have to actively search for information. A truly useful agent needs to proactively perceive its environment: a stock price hitting your threshold, a meeting agenda changing 10 minutes before it starts, a new paper dropping in your research area, a repo trending on GitHub that's relevant to your project.

Right now, an agent only knows your flight is delayed when you tell it — or when it happens to check. That's not perception. That's polling at best, and human labor at worst.

Real perception means: the world changes, your agent knows — instantly, automatically, without anyone pulling the trigger.

## The Problem for Builders

Without a standard, every agent builder has to:

- Write bespoke integrations for each data source
- Design their own signal schema — none of which are interoperable
- Handle polling, webhooks, auth, dedup, backpressure from scratch

Each integration is a one-off. Each one parses a different API, emits a different JSON shape, breaks when you swap agent frameworks. The result: developers waste hours building perception infrastructure from scratch, and agents run on insufficient context.

## What W2A Changes

World2Agent makes perception pluggable:

- **Unified signal format** — one schema for all sources, designed for AI consumption
- **Pluggable sensors** — each sensor is an independent npm package; install only what you need
- **Pluggable delivery** — direct to agent, or enriched via a graph layer (self-hosted or third-party)
- **Pluggable transports** — stdout pipe, HTTP POST, or any custom transport
- **Zero lock-in** — run sensors yourself, compose them freely, no central server

Install a sensor, get structured data. Swap one sensor for another, your agent code doesn't change. Compose multiple sensors, they all speak the same schema.

## This Needs the Community

W2A isn't a product. It's an open protocol and an invitation — to build the perception layer for AI agents, together.

There are millions of data sources out there. We built a few sensors. The rest should come from you.

We built the protocol and the first sensors. But these are just the starting point — the real breakthroughs will come from the community.
