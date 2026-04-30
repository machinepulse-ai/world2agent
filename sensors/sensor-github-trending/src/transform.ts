import { createSignal, type W2ASignal } from "@world2agent/sdk";
import type { TrendingRepo } from "./types.js";

const SENSOR_META = {
  id: "@world2agent/sensor-github-trending",
  version: "0.1.0",
  source_type: "github",
} as const;

export interface DigestInput {
  window: "daily" | "weekly";
  capturedAt: number;
  repos: TrendingRepo[];
}

export function transformTrendingDigest(input: DigestInput): W2ASignal {
  const { window, capturedAt, repos } = input;
  const windowLabel = window === "daily" ? "today" : "this week";

  const summary = buildSummary(window, windowLabel, repos);
  const markdown = buildMarkdown(window, windowLabel, repos);

  return createSignal(SENSOR_META, {
    source: { user_identity: "public" },
    event: {
      type: "repo.trending.refreshed",
      occurred_at: capturedAt,
      summary,
    },
    source_event: {
      schema: {
        type: "object",
        properties: {
          window: {
            type: "string",
            enum: ["daily", "weekly"],
            description: "Trending window: 'daily' = past 24h, 'weekly' = past 7 days.",
          },
          captured_at: {
            type: "string",
            format: "date-time",
            description: "When the trending page was scraped (ISO-8601 UTC).",
          },
          source_url: {
            type: "string",
            format: "uri",
            description: "The github.com/trending URL the digest was scraped from.",
          },
          repo_count: {
            type: "integer",
            description: "Number of repos included in this digest (top_n).",
          },
          repos: {
            type: "array",
            description:
              "Trending repos in rank order (rank 1 = top of the list on github.com/trending).",
            items: {
              type: "object",
              properties: {
                rank: {
                  type: "integer",
                  description: "1-based position on the trending page (1 = top).",
                },
                full_name: {
                  type: "string",
                  description: 'Repo full name in "owner/name" form, e.g. "vercel/next.js".',
                },
                author: { type: "string", description: "Repo owner (user or org)." },
                name: { type: "string", description: "Repo name without the owner prefix." },
                url: {
                  type: "string",
                  format: "uri",
                  description: "Canonical https://github.com/<owner>/<name> URL.",
                },
                description: {
                  type: "string",
                  description: "Repo description as shown on the trending page (may be empty).",
                },
                language: {
                  type: ["string", "null"],
                  description:
                    "Primary programming language as labelled by GitHub, or null when unknown.",
                },
                stars_total: {
                  type: "integer",
                  description: "Total stargazer count at scrape time.",
                },
                stars_gained_in_window: {
                  type: "integer",
                  description:
                    "Stars gained during the current trending window (24h for daily, 7d for weekly).",
                },
                forks: { type: "integer", description: "Total fork count at scrape time." },
              },
              required: [
                "rank",
                "full_name",
                "author",
                "name",
                "url",
                "stars_total",
                "stars_gained_in_window",
                "forks",
              ],
            },
          },
        },
        required: ["window", "captured_at", "source_url", "repo_count", "repos"],
      },
      data: {
        window,
        captured_at: new Date(capturedAt).toISOString(),
        source_url: `https://github.com/trending?since=${window}`,
        repo_count: repos.length,
        repos,
      },
    },
    attachments: [
      {
        type: "inline",
        mime_type: "text/markdown",
        description: `Human-readable digest of the top ${repos.length} ${window} trending GitHub repos with descriptions, languages, and star deltas.`,
        data: markdown,
      },
      {
        type: "reference",
        mime_type: "text/html",
        description: `Live github.com/trending page (${window} window) — fetch on demand for a fresh view.`,
        uri: `https://github.com/trending?since=${window}`,
      },
    ],
  });
}

function buildSummary(
  window: "daily" | "weekly",
  windowLabel: string,
  repos: TrendingRepo[],
): string {
  if (repos.length === 0) {
    return `GitHub Trending ${window} digest: no repos returned by github.com/trending; the scraper may need updating.`;
  }
  const lead = repos[0];
  const sample = repos
    .slice(0, Math.min(3, repos.length))
    .map((r) => r.full_name)
    .join(", ");
  const langs = uniqueLanguages(repos).slice(0, 3).join(", ") || "mixed languages";
  return `GitHub Trending ${window} digest: top ${repos.length} repos (${sample}…) led by ${lead.full_name} (+${lead.stars_gained_in_window.toLocaleString()} stars ${windowLabel}); covers ${langs}.`;
}

function buildMarkdown(
  window: "daily" | "weekly",
  windowLabel: string,
  repos: TrendingRepo[],
): string {
  const header = `# GitHub Trending — ${window} digest\n\nTop ${repos.length} repos on https://github.com/trending?since=${window}.\n\n`;
  const body = repos
    .map((r) => {
      const lang = r.language ? ` · ${r.language}` : "";
      const desc = r.description ? `\n  ${r.description}` : "";
      return `${r.rank}. **[${r.full_name}](${r.url})** — ★ ${r.stars_total.toLocaleString()} (+${r.stars_gained_in_window.toLocaleString()} ${windowLabel}) · ⑂ ${r.forks.toLocaleString()}${lang}${desc}`;
    })
    .join("\n");
  return header + body + "\n";
}

function uniqueLanguages(repos: TrendingRepo[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of repos) {
    if (r.language && !seen.has(r.language)) {
      seen.add(r.language);
      out.push(r.language);
    }
  }
  return out;
}
