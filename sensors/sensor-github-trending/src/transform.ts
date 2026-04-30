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
    return `🔥 GitHub Trending — no repos returned by github.com/trending?since=${window}; the scraper may need updating.`;
  }
  const lead = repos[0];
  const dateStr = formatDate(new Date());
  const langSummary =
    uniqueLanguages(repos)
      .slice(0, 4)
      .map((l) => `${langEmoji(l)} ${l}`)
      .join(" · ") || "mixed languages";

  const lines: string[] = [];
  lines.push(
    `🔥 GitHub Trending — ${capitalise(window)} Digest (${dateStr}) · top ${repos.length}`,
  );
  lines.push(
    `📊 Lead: ${lead.full_name} +${lead.stars_gained_in_window.toLocaleString()} ⭐ ${windowLabel} · ${langSummary}`,
  );
  lines.push("");
  for (const r of repos) {
    lines.push(formatRepoLine(r, windowLabel));
  }
  lines.push("");
  lines.push(`🔗 Full live list: https://github.com/trending?since=${window}`);
  return lines.join("\n");
}

function formatRepoLine(r: TrendingRepo, windowLabel: string): string {
  const langTag = r.language ? `${langEmoji(r.language)} ${r.language}` : "🧩 unknown";
  const heat = heatBadge(r);
  const blurb = oneLineBlurb(r);
  // Two-line per repo: header (rank + name + stats + heat) and indented blurb.
  // `[name](url)` makes the link clickable in any markdown renderer.
  return [
    `${rankEmoji(r.rank)} **[${r.full_name}](${r.url})** · ${langTag} · ⭐ ${r.stars_total.toLocaleString()} (+${r.stars_gained_in_window.toLocaleString()} ${windowLabel}) · ${heat}`,
    `   ↳ ${blurb}`,
  ].join("\n");
}

function buildMarkdown(
  window: "daily" | "weekly",
  windowLabel: string,
  repos: TrendingRepo[],
): string {
  const dateStr = formatDate(new Date());
  const langSummary =
    uniqueLanguages(repos)
      .slice(0, 6)
      .map((l) => `${langEmoji(l)} ${l}`)
      .join(" · ") || "mixed";

  const out: string[] = [];
  out.push(`# 🔥 GitHub Trending — ${capitalise(window)} Digest`);
  out.push(``);
  out.push(`📅 **${dateStr}** · top ${repos.length} on github.com/trending?since=${window}`);
  out.push(`🏷️ **Languages:** ${langSummary}`);
  out.push(``);
  out.push(`---`);
  out.push(``);

  for (const r of repos) {
    const langTag = r.language ? `${langEmoji(r.language)} ${r.language}` : "🧩 unknown";
    const heat = heatBadge(r);
    const useCase = useCaseHint(r);
    const whyHot = whyHotReason(r, windowLabel);

    out.push(
      `## ${rankEmoji(r.rank)} [${r.full_name}](${r.url})`,
    );
    out.push(``);
    out.push(
      `${langTag} · ⭐ **${r.stars_total.toLocaleString()}** (+${r.stars_gained_in_window.toLocaleString()} ${windowLabel}) · ⑂ ${r.forks.toLocaleString()} · ${heat}`,
    );
    out.push(``);
    if (r.description) {
      out.push(`> ${r.description}`);
      out.push(``);
    }
    out.push(`- 🚀 **Why it's hot:** ${whyHot}`);
    out.push(`- 🛠️ **Use it for:** ${useCase}`);
    out.push(`- 🔗 ${r.url}`);
    out.push(``);
  }

  return out.join("\n");
}

/* ──────────────────────────────────────────────────────────── */
/*  Heuristics — derived from data we already have, no extra    */
/*  network calls. Cheap, deterministic, good enough for triage.*/
/* ──────────────────────────────────────────────────────────── */

function heatBadge(r: TrendingRepo): string {
  if (r.stars_total === 0) return "🆕 brand new";
  const ratio = r.stars_gained_in_window / r.stars_total;
  if (ratio > 0.5) return "🆕 brand new (most stars came this window)";
  if (ratio > 0.15) return "🚀 surging";
  if (r.stars_total >= 50_000) return "🏆 established giant trending again";
  if (r.stars_gained_in_window >= 1_000) return "📈 strong momentum";
  return "📈 climbing";
}

function whyHotReason(r: TrendingRepo, windowLabel: string): string {
  const ratio = r.stars_total > 0 ? r.stars_gained_in_window / r.stars_total : 0;
  if (ratio > 0.5) {
    return `New project — ${Math.round(ratio * 100)}% of total stars (${r.stars_gained_in_window.toLocaleString()} of ${r.stars_total.toLocaleString()}) were earned ${windowLabel}.`;
  }
  if (ratio > 0.15) {
    return `Strong momentum — gained ${r.stars_gained_in_window.toLocaleString()} stars (${Math.round(ratio * 100)}% relative growth) ${windowLabel}.`;
  }
  if (r.stars_total >= 50_000) {
    return `Long-running project resurfacing — ${r.stars_gained_in_window.toLocaleString()} new stars on top of ${r.stars_total.toLocaleString()} total ${windowLabel}.`;
  }
  return `Steady climb — ${r.stars_gained_in_window.toLocaleString()} stars ${windowLabel} (${r.stars_total.toLocaleString()} total).`;
}

/**
 * Best-effort one-line "what is this" for `event.summary`. Falls back to
 * the GitHub description. Only enrich when description is empty/short.
 */
function oneLineBlurb(r: TrendingRepo): string {
  const desc = (r.description || "").trim();
  if (desc.length >= 30) return truncate(desc, 160);
  const cat = categoryHint(r);
  if (desc) return `${desc} (${cat})`;
  return cat;
}

/**
 * What you might do with it — heuristic from name + description + language.
 * The agent should still reason from the README; this is a triage hint.
 */
function useCaseHint(r: TrendingRepo): string {
  const cat = categoryHint(r);
  const desc = (r.description || "").trim();
  if (desc) return `${cat}. ${truncate(desc, 200)}`;
  return cat;
}

function categoryHint(r: TrendingRepo): string {
  const text = `${r.name} ${r.description ?? ""}`.toLowerCase();
  const has = (...words: string[]) => words.some((w) => text.includes(w));

  if (has("agent", "autonom", "claude", "gpt-", "llm", "rag")) {
    return "AI agent / LLM tooling — wire into your agent stack or study the prompts";
  }
  if (has("model", "transformer", "diffusion", "training", "fine-tun", "inference")) {
    return "ML model / training infra — reference for model engineering";
  }
  if (has("framework", "library", "sdk", "toolkit")) {
    return "Dev framework / SDK — drop-in dependency";
  }
  if (has("cli", "terminal", "tui")) {
    return "CLI / terminal tool — install and use directly";
  }
  if (has("api", "server", "gateway", "proxy", "middleware")) {
    return "Backend / API service — self-host or study the architecture";
  }
  if (has("ui", "component", "design", "tailwind", "shadcn")) {
    return "UI components / design system — copy into your frontend";
  }
  if (has("docker", "kubernetes", "k8s", "devops", "deploy", "infra", "ci/cd")) {
    return "DevOps / infra — study or adopt for ops";
  }
  if (has("security", "vuln", "exploit", "pentest", "hack", "fuzz")) {
    return "Security tooling — defensive use / pentest practice";
  }
  if (has("game", "engine", "shader")) {
    return "Game / graphics — study or fork";
  }
  if (has("awesome", "list", "resources", "tutorial", "course", "book")) {
    return "Curated resources — bookmark for learning";
  }
  if (has("trading", "finance", "quant", "market")) {
    return "Finance / trading tooling — study the strategies or self-host";
  }
  if (r.language === "Python") return "Python project — pip install and try";
  if (r.language === "TypeScript" || r.language === "JavaScript") {
    return "JS/TS project — npm install and try";
  }
  if (r.language === "Rust") return "Rust project — cargo add and try";
  if (r.language === "Go") return "Go project — go install and try";
  return "General-purpose project — read the README to see what fits";
}

function langEmoji(lang: string): string {
  const map: Record<string, string> = {
    Python: "🐍",
    TypeScript: "🟦",
    JavaScript: "🟨",
    Rust: "🦀",
    Go: "🐹",
    Java: "☕",
    Kotlin: "🟪",
    Swift: "🟧",
    "C++": "➕",
    C: "🔵",
    "C#": "🎯",
    Ruby: "💎",
    PHP: "🐘",
    Shell: "🐚",
    HTML: "🌐",
    CSS: "🎨",
    Vue: "🟢",
    Svelte: "🟠",
    Lua: "🌙",
    Dart: "🎯",
    Solidity: "💠",
    Zig: "⚡",
  };
  return map[lang] ?? "🧩";
}

function rankEmoji(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
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

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

function capitalise(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
