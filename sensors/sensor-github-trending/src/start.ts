import { ensureStore } from "@world2agent/sdk";
import type { CleanupFn, SensorContext } from "@world2agent/sdk";
import { fetchTrending } from "./fetch-trending.js";
import { transformTrendingDigest } from "./transform.js";
import type { GithubTrendingConfig, TrendingRepo } from "./types.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SEEN_KEY = "seen_repos";

interface SeenEntry {
  repo: string;
  cycle: number;
}

export async function start(
  ctx: SensorContext<GithubTrendingConfig>,
): Promise<CleanupFn> {
  const { cadence, top_n, dedupe_within_cycles } = ctx.config;
  const intervalMs = cadence === "daily" ? MS_PER_DAY : 7 * MS_PER_DAY;
  const store = ensureStore(ctx);

  let cycle = await readCycle(store);
  let stopped = false;
  let timer: NodeJS.Timeout | undefined;

  async function tick() {
    if (stopped) return;
    cycle += 1;
    try {
      const fetched = await fetchTrending(cadence, /* over-fetch for dedupe */ 25);
      const filtered = await filterSeen(store, fetched, dedupe_within_cycles, cycle);
      const repos = filtered.slice(0, top_n).map((r, i) => ({ ...r, rank: i + 1 }));

      const signal = transformTrendingDigest({
        window: cadence,
        capturedAt: Date.now(),
        repos,
      });
      await ctx.emit(signal);
      await recordSeen(store, repos, dedupe_within_cycles, cycle);
      await writeCycle(store, cycle);
      ctx.reportHealth("ok");
    } catch (err) {
      ctx.logger.error("github-trending tick failed", err);
      ctx.reportHealth("degraded", err instanceof Error ? err.message : String(err));
    }
  }

  // First emit on start, then on the cadence interval.
  void tick();
  timer = setInterval(tick, intervalMs);

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
  };
}

async function readCycle(store: { get(k: string): Promise<string | null> }): Promise<number> {
  const raw = await store.get("cycle");
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

async function writeCycle(
  store: { set(k: string, v: string): Promise<void> },
  cycle: number,
): Promise<void> {
  await store.set("cycle", String(cycle));
}

async function filterSeen(
  store: { get(k: string): Promise<string | null> },
  repos: TrendingRepo[],
  dedupeCycles: number,
  currentCycle: number,
): Promise<TrendingRepo[]> {
  if (dedupeCycles <= 0) return repos;
  const raw = await store.get(SEEN_KEY);
  if (!raw) return repos;
  let seen: SeenEntry[];
  try {
    seen = JSON.parse(raw) as SeenEntry[];
  } catch {
    return repos;
  }
  const cutoff = currentCycle - dedupeCycles;
  const blocked = new Set(seen.filter((e) => e.cycle > cutoff).map((e) => e.repo));
  return repos.filter((r) => !blocked.has(r.full_name));
}

async function recordSeen(
  store: {
    get(k: string): Promise<string | null>;
    set(k: string, v: string): Promise<void>;
  },
  repos: TrendingRepo[],
  dedupeCycles: number,
  currentCycle: number,
): Promise<void> {
  if (dedupeCycles <= 0) return;
  const raw = await store.get(SEEN_KEY);
  let seen: SeenEntry[] = [];
  if (raw) {
    try {
      seen = JSON.parse(raw) as SeenEntry[];
    } catch {
      seen = [];
    }
  }
  const cutoff = currentCycle - dedupeCycles;
  const kept = seen.filter((e) => e.cycle > cutoff);
  for (const r of repos) kept.push({ repo: r.full_name, cycle: currentCycle });
  await store.set(SEEN_KEY, JSON.stringify(kept));
}
