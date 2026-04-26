# Build a Sensor

Write your own sensor in ~50 lines.

## Fast path: use the skill

The fastest way is to let an AI coding agent walk you through it. Install our skill:

```bash
npx skills add https://github.com/machinepulse-ai/world2agent/skills/build-w2a-sensor
```

Then ask your coding agent: *"Build a W2A sensor for \<source>."* The skill walks through source interrogation, signal design, scaffolding, and the install recipe — the hard parts of sensor design are upstream of the code, and the skill front-loads them.

The example below is roughly what the skill produces — read on if you want to understand the shape, or skip straight to running the skill.

## Minimal Example

```typescript
import { defineSensor } from "@world2agent/sdk/sensor";
import { createSignal } from "@world2agent/sdk";
import { z } from "zod";

export default defineSensor({
  id: "my-sensor",
  version: "0.1.0",
  source_type: "my-source",
  auth: {
    type: "api_key",
    fields: [{ name: "token", label: "API Token", sensitive: true }],
  },
  configSchema: z.object({ token: z.string() }),

  async start(ctx) {
    const interval = setInterval(async () => {
      const data = await fetchMySource(ctx.config.token);

      const signal = createSignal(this, {
        event: {
          // domain is the abstract source space (`tasks`, `messaging`, `repo`, …),
          // not the platform name — platform lives in `source.source_type`.
          type: "tasks.item.created",
          summary: `${data.author} created "${data.title}" in ${data.project}; priority ${data.priority}, assigned to you`,
        },
        source_event: {
          schema: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Item id in the source platform",
              },
              priority: {
                type: "number",
                description: "Priority level: 0 (low) to 3 (urgent)",
              },
            },
          },
          data: { id: data.id, priority: data.priority },
        },
        attachments: [
          {
            type: "inline",
            mime_type: "text/plain",
            description: "Item description",
            data: data.body,
          },
        ],
      });

      await ctx.emit(signal);
    }, 60_000);

    return () => clearInterval(interval); // cleanup
  },
});
```

## Key Points

- `event.summary` is mandatory — write it so an AI can triage from this field alone
- Follow `Actor-Action-Object-Context-Impact`: who did what, where, why it matters
- `source_event` (top-level, not inside `event`) must include both `schema` (JSON Schema draft-07) and `data`. Every property in `schema` SHOULD carry a `description` — that's what makes the payload self-describing
- `attachments` is a tagged union — each item is `{ type: "inline", data }` or `{ type: "reference", uri }`, both with required `mime_type` and `description`. For content (text, images, diffs), not structured metadata
- The `start` function returns a cleanup function

## Publish

```bash
npm publish
```

Sensors are distributed via npm. Once published, anyone can install your sensor by package name.

## Standalone CLI

Every sensor also works as a standalone CLI — pipe it to any agent:

```bash
w2a-sensor-my-source | your-agent
```
