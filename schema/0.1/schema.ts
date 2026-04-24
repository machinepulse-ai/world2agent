/**
 * World2Agent Protocol — canonical schema.
 *
 * This file is the source of truth for what crosses the wire between
 * sensors, transports, graph layers, and agents.
 *
 * Deliberately out of scope:
 *   - Any runtime surface (logger, key-value store, metrics, retry policy,
 *     lifecycle functions). Those belong to language-specific SDKs.
 *   - Transport framing (stdio line pipe, HTTP POST, WebSocket). Each
 *     transport specifies its own wrapping around this schema.
 *   - Sensor packaging / install manifests. Those are a separate tooling
 *     concern, outside the wire-format protocol.
 *
 * Style: self-contained TypeScript — no imports, no runtime. JSDoc on each
 * field is the human-readable spec and also feeds JSON Schema generation
 * (see `schema.json` next to this file).
 *
 * Extensibility:
 *   - Most message objects carry `_meta?: Record<string, unknown>` so
 *     implementations can attach experimental or vendor-specific fields
 *     without protocol bumps. Consumers MUST ignore unknown `_meta` keys.
 *   - String-typed fields (`source_type`, `event.type`, `mime_type`) are
 *     OPEN sets — examples in JSDoc are non-exhaustive, no central
 *     registry, sensors coin their own values.
 *
 * Versioning: the directory name (`0.1`) matches {@link PROTOCOL_VERSION}.
 * Breaking changes bump the directory; additive changes are made in
 * place. Consumers pin to a directory, never to `main`.
 */

/* ────────────────────────────────────────────────────────────── */
/*  Common                                                        */
/* ────────────────────────────────────────────────────────────── */

/**
 * The schema version string every signal carries in
 * {@link W2ASignal.schema_version}. Consumers MUST reject signals whose
 * `schema_version` they do not understand.
 *
 * @category Common
 */
export const PROTOCOL_VERSION = "w2a/0.1";
export type ProtocolVersion = typeof PROTOCOL_VERSION;

/* ────────────────────────────────────────────────────────────── */
/*  Signal envelope                                               */
/* ────────────────────────────────────────────────────────────── */

/**
 * The unified signal envelope. Every sensor emits `W2ASignal` and every
 * consumer accepts `W2ASignal` — no sensor-specific shapes on the wire.
 *
 * An agent reading only {@link SignalEvent.summary} must be able to
 * decide whether and how to act. Everything else is for downstream
 * enrichment or audit.
 *
 * @category Signal
 */
export interface W2ASignal {
  /**
   * Unique identifier for deduplication and tracing.
   *
   * Sensors MUST generate a fresh id per emission, even for logically
   * identical events; consumers use this to idempotently process retries.
   *
   * @format uuid
   */
  signal_id: string;

  /** Protocol version — pinned to {@link PROTOCOL_VERSION}. */
  schema_version: ProtocolVersion;

  /**
   * When the signal was emitted by the sensor, UTC milliseconds since the
   * Unix epoch. Distinct from {@link SignalEvent.occurred_at}, which is
   * when the underlying real-world event happened.
   *
   * @TJS-type integer
   * @minimum 0
   */
  emitted_at: number;

  /** Identifies who emitted the signal and where it originated. */
  source: SignalSource;

  /** Describes what happened. */
  event: SignalEvent;

  /**
   * Self-describing original event data from the source platform.
   * Distinct from {@link W2ASignal.event}, which is the normalized
   * cross-source event summary and routing key.
   */
  source_event?: SourceEvent;

  /** Content attachments relevant to the signal. */
  attachments?: Attachment[];

  /**
   * Extension point for implementation-specific or experimental fields
   * (tracing ids, audit markers, vendor annotations). Consumers MUST
   * ignore unknown `_meta` keys.
   */
  _meta?: Record<string, unknown>;
}

/* ────────────────────────────────────────────────────────────── */
/*  Source                                                        */
/* ────────────────────────────────────────────────────────────── */

/**
 * Identifies the emitter of a signal.
 *
 * @category Signal
 */
export interface SignalSource {
  /**
   * Stable sensor identifier. By convention this is the npm package name
   * (e.g. `"@world2agent/sensor-github"`); for other registries it is the
   * canonical package coordinate for that registry.
   */
  sensor_id: string;

  /** Sensor semantic version, e.g. `"0.1.0"`. */
  sensor_version: string;

  /**
   * Logical source identifier shared across sensors of the same platform,
   * e.g. `"github"`, `"cron"`, `"feishu"`. Agents and graph layers use
   * this for coarse grouping independent of which package emitted.
   *
   * OPEN set — new platforms coin their own lowercase single-word
   * identifier; no central registry.
   */
  source_type: string;

  /**
   * Identity of the end user on the source platform (open id, handle,
   * account id). Enables per-user routing and multi-tenant isolation.
   */
  user_identity: string;

  /**
   * Package coordinate of the sensor — the canonical identifier channels
   * and bridges use to derive the agent-side handler id (e.g. a skill
   * name). Typically equal to {@link SignalSource.sensor_id}.
   */
  package: string;
}

/* ────────────────────────────────────────────────────────────── */
/*  Event                                                         */
/* ────────────────────────────────────────────────────────────── */

/**
 * Describes the real-world event that triggered the signal.
 *
 * @category Signal
 */
export interface SignalEvent {
  /**
   * Event classification using `domain.entity.action` naming, e.g.
   * `"messaging.message.mentioned"`, `"repo.issue.opened"`,
   * `"market.quote.threshold_crossed"`.
   *
   * - `domain` groups the source space (`messaging`, `repo`, `market`).
   * - `entity` is the object the event is about (`message`, `issue`).
   * - `action` is the verb in past tense (`mentioned`, `opened`).
   *
   * OPEN namespace — sensors define their own `domain.entity.action`
   * triples. Consumers pattern-match on this string, so the triples a
   * sensor emits are part of that sensor's public contract.
   */
  type: string;

  /**
   * When the event actually happened on the source platform, UTC
   * milliseconds. If the source does not expose this, sensors SHOULD
   * fall back to {@link W2ASignal.emitted_at}.
   *
   * @TJS-type integer
   * @minimum 0
   */
  occurred_at: number;

  /**
   * Natural-language summary — the soul of the signal. An AI reading
   * only this line must be able to decide whether and how to act.
   *
   * Recommended pattern (Actor–Action–Object–Context–Impact):
   *
   *     [Actor] [Action] [Object] in [Context]; [Impact]
   *
   * A vague summary has no value.
   *
   * @minLength 20
   */
  summary: string;

  /** Extension point. See {@link W2ASignal._meta}. */
  _meta?: Record<string, unknown>;
}

/**
 * Self-describing original event data from the source platform. Carries
 * machine-readable IDs, numbers, booleans, and other facts the graph
 * layer or agent may want to reason over or audit.
 *
 * @category Signal
 */
export interface SourceEvent {
  /**
   * JSON Schema draft-07 object describing the shape of
   * {@link SourceEvent.data}. Represented as an opaque record here;
   * consumers MAY validate that it parses as a JSON Schema.
   */
  schema: Record<string, unknown>;

  /** The actual structured data conforming to {@link SourceEvent.schema}. */
  data: Record<string, unknown>;

  /** Extension point. See {@link W2ASignal._meta}. */
  _meta?: Record<string, unknown>;
}

/* ────────────────────────────────────────────────────────────── */
/*  Attachments                                                   */
/* ────────────────────────────────────────────────────────────── */

/**
 * A single content attachment. Tagged union on {@link Attachment.type}:
 * content is either inlined as a string ({@link InlineAttachment}) or
 * referenced by URI ({@link ReferenceAttachment}).
 *
 * @category Signal
 */
export type Attachment = InlineAttachment | ReferenceAttachment;

/**
 * Inline attachment. For text mime types `data` is UTF-8; for binary
 * types `data` is base64-encoded.
 *
 * @category Signal
 */
export interface InlineAttachment {
  /** Discriminator. */
  type: "inline";

  /**
   * RFC 6838 media type, e.g. `"text/plain"`, `"image/png"`. OPEN set.
   */
  mime_type: string;

  /**
   * One-line human/AI description of what the attachment is, e.g.
   * `"Original message body"`, `"Error-rate dashboard screenshot"`.
   *
   * @minLength 1
   */
  description: string;

  /** Inline content. UTF-8 for text mime types, base64 for binary. */
  data: string;

  /** Extension point. See {@link W2ASignal._meta}. */
  _meta?: Record<string, unknown>;
}

/**
 * External reference attachment. Sensors SHOULD prefer `reference` for
 * anything larger than a few KiB, or anything already addressable.
 *
 * @category Signal
 */
export interface ReferenceAttachment {
  /** Discriminator. */
  type: "reference";

  /**
   * RFC 6838 media type, e.g. `"image/png"`. OPEN set.
   */
  mime_type: string;

  /**
   * One-line human/AI description of what the attachment is.
   *
   * @minLength 1
   */
  description: string;

  /**
   * External reference (HTTPS URL, `file://`, or a content-addressed
   * scheme). Consumers fetch on demand.
   *
   * @format uri
   */
  uri: string;

  /** Extension point. See {@link W2ASignal._meta}. */
  _meta?: Record<string, unknown>;
}
