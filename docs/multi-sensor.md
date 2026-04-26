# Multi-Sensor Composition

Compose sensors freely — they all speak the same schema. Same handler, regardless of source. Swap one sensor for another, your agent code doesn't change.

## Basic Composition

```typescript
import { runAll } from "@world2agent/sdk/sensor";
import { fanout, stdoutTransport, httpTransport } from "@world2agent/sdk/transports";

await runAll([
  { spec: github, config: { token: "xxx" } },
  { spec: steam, config: { userId: "xxx" } },
  { spec: gcal, config: { clientId: "xxx", clientSecret: "xxx", refresh_token: "xxx" } },
], {
  onSignal: fanout([
    stdoutTransport(),
    httpTransport({ url: "https://your-app.com/api/signals" }),
  ]),
});
```

## Pipe Mode

Every sensor has a standalone CLI. Compose at the shell level:

```bash
w2a-sensor-github | your-consumer-app
```

## Multiple Transports

Fan out the same signal to multiple destinations:

- `stdoutTransport()` — pipe to another process
- `httpTransport({ url })` — POST to an endpoint
- Custom transports — implement your own
