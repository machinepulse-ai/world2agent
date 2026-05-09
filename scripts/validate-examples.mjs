#!/usr/bin/env node
// Validate every example signal under schema/0.1/examples/ against the
// generated JSON Schema. Exits non-zero if any example fails.
//
// Run locally: `npm run validate:examples`
// Run in CI:   .github/workflows/protocol.yml

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const SCHEMA_PATH = "schema/0.1/schema.json";
const EXAMPLES_DIR = "schema/0.1/examples";
const ROOT_DEFINITION = "W2ASignal";

const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));

// `schema.json` is generated with `--topRef` and exports every type under
// `definitions`, so the file has no top-level entry point. Wrap it with a
// `$ref` to the canonical signal envelope before compiling.
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile({
  ...schema,
  $ref: `#/definitions/${ROOT_DEFINITION}`,
});

let examples;
try {
  examples = readdirSync(EXAMPLES_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => join(EXAMPLES_DIR, name))
    .filter((path) => statSync(path).isFile());
} catch (err) {
  if (err.code === "ENOENT") {
    console.error(`No examples directory at ${EXAMPLES_DIR}.`);
    process.exit(1);
  }
  throw err;
}

if (examples.length === 0) {
  console.error(`No *.json examples found under ${EXAMPLES_DIR}.`);
  process.exit(1);
}

let failed = 0;
for (const path of examples) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  if (validate(data)) {
    console.log(`ok   ${path}`);
    continue;
  }
  failed += 1;
  console.error(`fail ${path}`);
  for (const err of validate.errors ?? []) {
    const where = err.instancePath || "(root)";
    console.error(`     ${where} ${err.message}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} example(s) failed validation against ${SCHEMA_PATH}.`);
  process.exit(1);
}
console.log(`\nAll ${examples.length} example(s) valid against ${SCHEMA_PATH}.`);
