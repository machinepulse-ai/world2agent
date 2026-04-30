/**
 * Smoke test: run the sensor against live github.com/trending once,
 * print the resulting signal, then exit. No scheduling, no install flow.
 *
 *   pnpm build && pnpm smoke
 *   pnpm build && pnpm smoke -- --cadence daily --top_n 5
 */
import { fetchTrending } from "./fetch-trending.js";
import { transformTrendingDigest } from "./transform.js";

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const cadence = arg("cadence", "weekly") as "daily" | "weekly";
const topN = Number.parseInt(arg("top_n", "10"), 10);

if (cadence !== "daily" && cadence !== "weekly") {
  console.error(`invalid --cadence ${cadence}; must be 'daily' or 'weekly'`);
  process.exit(2);
}

const repos = await fetchTrending(cadence, topN);
const signal = transformTrendingDigest({
  window: cadence,
  capturedAt: Date.now(),
  repos,
});

process.stdout.write(JSON.stringify(signal, null, 2) + "\n");
