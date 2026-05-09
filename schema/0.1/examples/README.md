# Example signals

Canonical `W2ASignal` payloads — one per file. Treat them as the copy-pastable reference for sensor authors and consumers, and as fixtures the schema validator runs against in CI (`npm run validate:examples`).

Adding an example:

1. Drop a new `<name>.json` here that conforms to [`../schema.json`](../schema.json).
2. Run `npm run validate:examples` locally — the CI job in `.github/workflows/protocol.yml` runs the same check.
