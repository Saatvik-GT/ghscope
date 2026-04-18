import { listContributors, listReleases, listClosedPRs, listPRReviews, getContents } from "../github.js";
import type { Repo, HiringResult } from "../types.js";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export async function analyzeHiring(org: string, repos: Repo[]): Promise<HiringResult> {
  const topRepos = repos.slice(0, 10);
  const topRepo = repos[0];

  const [busFactorRisk, teamSize] = await calcBusFactor(org, topRepos);
  const [releaseCadence, releasesLastYear] = await calcReleaseCadence(org, topRepo?.name ?? "");
  const [avgReviewDays, codeownersPresent] = await Promise.all([
    calcAvgReviewTime(org, topRepo?.name ?? ""),
    topRepo ? getContents(org, topRepo.name, "CODEOWNERS").then((c) => c !== null) : Promise.resolve(false),
  ]);

  return { busFactorRisk, releaseCadence, avgReviewDays, teamSize, codeownersPresent, releasesLastYear };
}

async function calcBusFactor(org: string, repos: Repo[]): Promise<["low" | "medium" | "high", number]> {
  const allContributors = new Set<string>();
  let lowBusFactorRepos = 0;

  await Promise.all(
    repos.map(async (repo) => {
      const contributors = await listContributors(org, repo.name);
      contributors.forEach((c) => {
        if (c.login) allContributors.add(c.login);
      });
      if (contributors.length < 3) lowBusFactorRepos++;
    })
  );

  const riskRatio = lowBusFactorRepos / repos.length;
  const busFactorRisk: "low" | "medium" | "high" =
    riskRatio < 0.2 ? "low" : riskRatio < 0.5 ? "medium" : "high";

  return [busFactorRisk, allContributors.size];
}

async function calcReleaseCadence(
  org: string,
  repo: string
): Promise<["weekly" | "monthly" | "sporadic" | "none", number]> {
  if (!repo) return ["none", 0];

  const releases = await listReleases(org, repo);
  const cutoff = Date.now() - ONE_YEAR_MS;
  const recentReleases = releases.filter((r) => new Date(r.created_at).getTime() > cutoff);

  if (recentReleases.length === 0) return ["none", 0];
  if (recentReleases.length >= 48) return ["weekly", recentReleases.length];
  if (recentReleases.length >= 10) return ["monthly", recentReleases.length];
  return ["sporadic", recentReleases.length];
}

async function calcAvgReviewTime(org: string, repo: string): Promise<number | null> {
  if (!repo) return null;

  const prs = await listClosedPRs(org, repo, 20);
  const mergedPRs = prs.filter((pr) => pr.merged_at !== null).slice(0, 10);
  if (mergedPRs.length === 0) return null;

  const reviewTimes: number[] = [];

  await Promise.all(
    mergedPRs.map(async (pr) => {
      const reviews = await listPRReviews(org, repo, pr.number);
      if (reviews.length > 0) {
        const prCreated = new Date(pr.created_at).getTime();
        const firstReview = new Date(reviews[0].submitted_at ?? pr.created_at).getTime();
        const days = (firstReview - prCreated) / (1000 * 60 * 60 * 24);
        if (days >= 0) reviewTimes.push(days);
      }
    })
  );

  if (reviewTimes.length === 0) return null;
  return parseFloat((reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length).toFixed(1));
}
