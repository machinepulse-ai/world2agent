# SensorHub

SensorHub is a discovery layer on top of npm. Every W2A sensor is a standard npm package — SensorHub makes them easier to find.

No separate registry. No new platform. npm is the single source for hosting and distribution.

## Find Sensors

Browse the catalog at [world2agent.ai/hub](https://world2agent.ai/hub), or search npm directly:

```bash
npm search w2a-sensor
```

Install any sensor by package name:

```bash
npm install {PackageName}
```

## Publish a Sensor

Build your sensor with the [W2A SDK](./build-a-sensor.md), then ship it to npm:

```bash
npm publish
```

That's the distribution. SensorHub indexes published sensors and surfaces them on the website — no separate publish step today.

Requirements:
- An npm account (this is the quality gate — npm identity = accountability)
- A public GitHub link is recommended; open-source sensors get higher visibility

## How It Works

SensorHub is a thin index layer. It doesn't host any code or packages.

Each sensor entry stores:

| Field | Source |
|-------|--------|
| npm package name | Developer submits |
| Description | Developer submits |
| GitHub URL | Developer submits (optional, boosts ranking) |
| Category tags | Developer submits |
| Install count | Pulled from npm API |
| Open source flag | Auto-detected from GitHub URL |

## Ranking

Sensors are ranked by: **npm install count × open source weight**

Open-source sensors (with a GitHub link) rank higher. This incentivizes transparency and auditability.
