import { getContents } from "../github.js";
import type { Repo, HealthResult } from "../types.js";

const STALE_DAYS = 180;

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export async function analyzeHealth(org: string, repos: Repo[]): Promise<HealthResult> {
  const topRepo = repos[0];
  if (!topRepo) {
    return { healthScore: 0, totalRepos: 0, staleCount: 0, hasContributing: false, hasLicense: false, avgOpenIssues: 0 };
  }

  const [hasContributing, hasLicense] = await Promise.all([
    getContents(org, topRepo.name, "CONTRIBUTING.md").then((c) => c !== null),
    getContents(org, topRepo.name, "LICENSE").then(async (c) => {
      if (c !== null) return true;
      return getContents(org, topRepo.name, "LICENSE.md").then((c2) => c2 !== null);
    }),
  ]);

  const staleCount = repos.filter((r) => daysSince(r.pushed_at) > STALE_DAYS).length;
  const avgOpenIssues = Math.round(repos.reduce((sum, r) => sum + r.open_issues_count, 0) / repos.length);

  const healthScore = calcHealthScore(repos, hasContributing, hasLicense, staleCount, avgOpenIssues);

  return {
    healthScore,
    totalRepos: repos.length,
    staleCount,
    hasContributing,
    hasLicense,
    avgOpenIssues,
  };
}

function calcHealthScore(
  repos: Repo[],
  hasContributing: boolean,
  hasLicense: boolean,
  staleCount: number,
  avgOpenIssues: number
): number {
  let score = 0;

  if (hasContributing) score += 20;
  if (hasLicense) score += 10;

  const stalePercent = (staleCount / repos.length) * 100;
  if (stalePercent === 0) score += 30;
  else if (stalePercent < 20) score += 20;
  else if (stalePercent < 40) score += 10;

  if (avgOpenIssues < 10) score += 20;
  else if (avgOpenIssues < 50) score += 10;
  else if (avgOpenIssues < 200) score += 5;

  const hasREADME = repos.some((r) => r.name.toLowerCase() !== ".github");
  if (hasREADME) score += 20;

  return Math.min(score, 100);
}
