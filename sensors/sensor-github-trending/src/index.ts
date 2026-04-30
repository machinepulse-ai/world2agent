import { defineSensor } from "@world2agent/sdk/sensor";
import { start } from "./start.js";
import { githubTrendingConfigSchema } from "./types.js";

export default defineSensor({
  id: "@world2agent/sensor-github-trending",
  version: "0.1.0",
  source_type: "github",
  auth: { type: "none" },
  configSchema: githubTrendingConfigSchema,
  start,
});

export { transformTrendingDigest } from "./transform.js";
export { fetchTrending, parseTrendingHtml } from "./fetch-trending.js";
export { githubTrendingConfigSchema } from "./types.js";
export type { GithubTrendingConfig, TrendingRepo } from "./types.js";
