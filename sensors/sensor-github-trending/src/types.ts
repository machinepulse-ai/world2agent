import { z } from "zod";

export const githubTrendingConfigSchema = z.object({
  /** Refresh cadence — controls both the GitHub `since=` window and the emit interval. */
  cadence: z.enum(["daily", "weekly"]).default("weekly"),
  /** How many repos to include in each digest signal. GitHub's page lists up to 25. */
  top_n: z.number().int().min(1).max(25).default(10),
  /**
   * If > 0, repos seen in any of the last N digests are skipped. Default 0 (always send).
   * Useful when the same repos linger on the trending list across cycles.
   */
  dedupe_within_cycles: z.number().int().min(0).max(52).default(0),
});

export type GithubTrendingConfig = z.infer<typeof githubTrendingConfigSchema>;

export interface TrendingRepo {
  rank: number;
  full_name: string;
  author: string;
  name: string;
  url: string;
  description: string;
  language: string | null;
  stars_total: number;
  stars_gained_in_window: number;
  forks: number;
}
