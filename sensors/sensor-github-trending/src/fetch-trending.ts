import * as cheerio from "cheerio";
import type { TrendingRepo } from "./types.js";

const TRENDING_URL = "https://github.com/trending";

export async function fetchTrending(
  window: "daily" | "weekly",
  topN: number,
): Promise<TrendingRepo[]> {
  const url = `${TRENDING_URL}?since=${window}`;
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; w2a-sensor-github-trending/0.1.0; +https://world2agent.ai)",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    throw new Error(`github.com/trending returned ${res.status} ${res.statusText}`);
  }
  return parseTrendingHtml(await res.text(), topN);
}

export function parseTrendingHtml(html: string, topN: number): TrendingRepo[] {
  const $ = cheerio.load(html);
  const repos: TrendingRepo[] = [];

  $("article.Box-row").each((index, el) => {
    if (repos.length >= topN) return false;

    const $el = $(el);
    const titleAnchor = $el.find("h2.h3.lh-condensed a").first();
    const href = (titleAnchor.attr("href") ?? "").trim();
    if (!href || !href.startsWith("/")) return;

    const fullName = href.slice(1);
    const [author, name] = fullName.split("/");
    if (!author || !name) return;

    const description = $el.find("p.col-9").first().text().trim();
    const language =
      $el.find('[itemprop="programmingLanguage"]').first().text().trim() || null;

    const starsTotal = parseIntCommaSafe(
      $el.find(`a[href="/${fullName}/stargazers"]`).first().text(),
    );
    const forks = parseIntCommaSafe(
      $el.find(`a[href="/${fullName}/forks"]`).first().text(),
    );

    let starsGained = 0;
    $el.find("span.d-inline-block.float-sm-right").each((_, span) => {
      const t = $(span).text().trim();
      const m = t.match(/([\d,]+)\s+stars?/i);
      if (m) starsGained = parseIntCommaSafe(m[1]);
    });

    repos.push({
      rank: index + 1,
      full_name: fullName,
      author,
      name,
      url: `https://github.com/${fullName}`,
      description,
      language,
      stars_total: starsTotal,
      stars_gained_in_window: starsGained,
      forks,
    });
    return;
  });

  return repos;
}

function parseIntCommaSafe(s: string): number {
  const cleaned = s.replace(/[,\s]/g, "");
  const n = Number.parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : 0;
}
