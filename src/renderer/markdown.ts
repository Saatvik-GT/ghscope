import type { OrgReport } from "../types.js";

export function renderMarkdown(report: OrgReport, showHiring: boolean): void {
  const { org, stack, health, contribution, hiring } = report;

  const lines: string[] = [
    `# StackProbe — github/${org}`,
    `> Probed on ${new Date(report.probeDate).toLocaleDateString()}`,
    "",
    "## Tech Stack",
    `| | |`,
    `|---|---|`,
    `| **Languages** | ${stack.languages.map((l) => `${l.name} (${l.percent}%)`).join(", ") || "—"} |`,
    `| **Frameworks** | ${stack.frameworks.join(", ") || "—"} |`,
    `| **CI/CD** | ${stack.cicd.join(", ") || "—"} |`,
    "",
    `## Repo Health — ${health.healthScore}/100`,
    `| | |`,
    `|---|---|`,
    `| Repos analyzed | ${health.totalRepos} |`,
    `| Stale repos (>180d) | ${health.staleCount} / ${health.totalRepos} |`,
    `| CONTRIBUTING.md | ${health.hasContributing ? "✓" : "✗"} |`,
    `| LICENSE | ${health.hasLicense ? "✓" : "✗"} |`,
    `| Avg open issues | ${health.avgOpenIssues} |`,
    "",
    `## Contribution Readiness — ${contribution.readinessScore}/100`,
    `| | |`,
    `|---|---|`,
    `| Good First Issues | ${contribution.gfiCount} |`,
    `| Help Wanted | ${contribution.helpWantedCount} |`,
    `| PR Merge Rate | ${contribution.prMergeRate}% |`,
    `| Avg Response Time | ${contribution.avgResponseHours !== null ? `${contribution.avgResponseHours} hrs` : "—"} |`,
    `| Issue Templates | ${contribution.hasTemplates ? "✓" : "✗"} |`,
  ];

  if (showHiring && hiring) {
    lines.push(
      "",
      "## Hiring Signals",
      `| | |`,
      `|---|---|`,
      `| Bus Factor Risk | ${hiring.busFactorRisk} |`,
      `| Team Size | ~${hiring.teamSize} contributors |`,
      `| Release Cadence | ${hiring.releaseCadence} |`,
      `| Releases (12mo) | ${hiring.releasesLastYear} |`,
      `| Avg Review Time | ${hiring.avgReviewDays !== null ? `${hiring.avgReviewDays} days` : "—"} |`,
      `| CODEOWNERS | ${hiring.codeownersPresent ? "✓" : "✗"} |`
    );
  }

  console.log(lines.join("\n"));
}
