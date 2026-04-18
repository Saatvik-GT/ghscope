import { searchIssues, listClosedPRs, listIssues, listIssueComments, getContents } from "../github.js";
import type { Repo, ContributionResult } from "../types.js";

export async function analyzeContribution(org: string, repos: Repo[]): Promise<ContributionResult> {
  const topRepo = repos[0];

  const [gfiCount, helpWantedCount, prMergeRate, avgResponseHours, hasTemplates] = await Promise.all([
    searchIssues(`org:${org} is:open label:"good first issue"`),
    searchIssues(`org:${org} is:open label:"help wanted"`),
    calcPRMergeRate(org, topRepo?.name ?? ""),
    calcAvgResponseTime(org, topRepo?.name ?? ""),
    detectTemplates(org, topRepo?.name ?? ""),
  ]);

  const readinessScore = calcReadinessScore(gfiCount, prMergeRate, avgResponseHours, hasTemplates);

  return { readinessScore, gfiCount, helpWantedCount, prMergeRate, avgResponseHours, hasTemplates };
}

async function calcPRMergeRate(org: string, repo: string): Promise<number> {
  if (!repo) return 0;
  const prs = await listClosedPRs(org, repo, 100);
  if (prs.length === 0) return 0;
  const merged = prs.filter((pr) => pr.merged_at !== null).length;
  return Math.round((merged / prs.length) * 100);
}

async function calcAvgResponseTime(org: string, repo: string): Promise<number | null> {
  if (!repo) return null;
  const issues = await listIssues(org, repo, 20);
  if (issues.length === 0) return null;

  const responseTimes: number[] = [];

  await Promise.all(
    issues.slice(0, 10).map(async (issue) => {
      const comments = await listIssueComments(org, repo, issue.number);
      if (comments.length > 0 && comments[0].created_at) {
        const openedAt = new Date(issue.created_at).getTime();
        const firstComment = new Date(comments[0].created_at).getTime();
        const hours = (firstComment - openedAt) / (1000 * 60 * 60);
        if (hours >= 0) responseTimes.push(hours);
      }
    })
  );

  if (responseTimes.length === 0) return null;
  return Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
}

async function detectTemplates(org: string, repo: string): Promise<boolean> {
  if (!repo) return false;
  const [issueTemplate, prTemplate] = await Promise.all([
    getContents(org, repo, ".github/ISSUE_TEMPLATE"),
    getContents(org, repo, ".github/pull_request_template.md"),
  ]);
  return issueTemplate !== null || prTemplate !== null;
}

function calcReadinessScore(
  gfiCount: number,
  prMergeRate: number,
  avgResponseHours: number | null,
  hasTemplates: boolean
): number {
  let score = 0;

  if (gfiCount >= 20) score += 30;
  else if (gfiCount >= 10) score += 20;
  else if (gfiCount >= 5) score += 10;
  else if (gfiCount >= 1) score += 5;

  if (prMergeRate >= 70) score += 30;
  else if (prMergeRate >= 50) score += 20;
  else if (prMergeRate >= 30) score += 10;

  if (avgResponseHours !== null) {
    if (avgResponseHours <= 24) score += 20;
    else if (avgResponseHours <= 72) score += 10;
    else if (avgResponseHours <= 168) score += 5;
  }

  if (hasTemplates) score += 20;

  return Math.min(score, 100);
}
