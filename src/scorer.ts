import type { StackResult, HealthResult, ContributionResult, HiringResult, OrgReport } from "./types.js";

export function buildReport(
  org: string,
  stack: StackResult,
  health: HealthResult,
  contribution: ContributionResult,
  hiring: HiringResult | null
): OrgReport {
  return {
    org,
    probeDate: new Date().toISOString(),
    stack,
    health,
    contribution,
    hiring,
  };
}
