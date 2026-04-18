import chalk from "chalk";
import Table from "cli-table3";
import type { OrgReport } from "../types.js";

function scoreColor(score: number): string {
  if (score >= 70) return chalk.green(String(score));
  if (score >= 40) return chalk.yellow(String(score));
  return chalk.red(String(score));
}

function busRiskColor(risk: string): string {
  if (risk === "low") return chalk.green(risk);
  if (risk === "medium") return chalk.yellow(risk);
  return chalk.red(risk);
}

function cadenceLabel(cadence: string): string {
  const map: Record<string, string> = {
    weekly: chalk.green("Weekly"),
    monthly: chalk.yellow("Monthly"),
    sporadic: chalk.yellow("Sporadic"),
    none: chalk.red("None detected"),
  };
  return map[cadence] ?? cadence;
}

export function renderTable(report: OrgReport, showHiring: boolean): void {
  const { org, stack, health, contribution, hiring } = report;

  const width = 56;
  const header = new Table({ style: { border: [], head: [] } });
  header.push([{ content: chalk.bold.cyan(`  StackProbe  ›  github/${org}`), colSpan: 1 }]);
  console.log(header.toString());

  // --- TECH STACK ---
  const stackTable = new Table({
    head: [chalk.bold("TECH STACK"), ""],
    colWidths: [22, width - 22],
    style: { border: [], head: [] },
  });

  stackTable.push(
    ["Languages", stack.languages.map((l) => `${l.name} (${l.percent}%)`).join(", ") || "—"],
    ["Frameworks", stack.frameworks.join(", ") || "—"],
    ["CI/CD", stack.cicd.join(", ") || "—"]
  );
  console.log(stackTable.toString());

  // --- REPO HEALTH ---
  const healthTable = new Table({
    head: [chalk.bold("REPO HEALTH"), `${scoreColor(health.healthScore)}/100`],
    colWidths: [22, width - 22],
    style: { border: [], head: [] },
  });

  healthTable.push(
    ["Repos analyzed", `${health.totalRepos}`],
    ["Stale repos (>180d)", `${health.staleCount} / ${health.totalRepos}`],
    ["CONTRIBUTING.md", health.hasContributing ? chalk.green("✓") : chalk.red("✗")],
    ["LICENSE", health.hasLicense ? chalk.green("✓") : chalk.red("✗")],
    ["Avg open issues", `${health.avgOpenIssues}`]
  );
  console.log(healthTable.toString());

  // --- CONTRIBUTION READINESS ---
  const contribTable = new Table({
    head: [chalk.bold("CONTRIBUTION READINESS"), `${scoreColor(contribution.readinessScore)}/100`],
    colWidths: [22, width - 22],
    style: { border: [], head: [] },
  });

  contribTable.push(
    ["Good First Issues", `${contribution.gfiCount}`],
    ["Help Wanted", `${contribution.helpWantedCount}`],
    ["PR Merge Rate", `${contribution.prMergeRate}%`],
    [
      "Avg Response Time",
      contribution.avgResponseHours !== null ? `${contribution.avgResponseHours} hrs` : "—",
    ],
    ["Issue Templates", contribution.hasTemplates ? chalk.green("✓") : chalk.red("✗")]
  );
  console.log(contribTable.toString());

  // --- HIRING SIGNALS ---
  if (showHiring && hiring) {
    const hiringTable = new Table({
      head: [chalk.bold("HIRING SIGNALS"), ""],
      colWidths: [22, width - 22],
      style: { border: [], head: [] },
    });

    hiringTable.push(
      ["Bus Factor Risk", busRiskColor(hiring.busFactorRisk)],
      ["Team Size", `~${hiring.teamSize} contributors`],
      ["Release Cadence", cadenceLabel(hiring.releaseCadence)],
      ["Releases (12mo)", `${hiring.releasesLastYear}`],
      [
        "Avg Review Time",
        hiring.avgReviewDays !== null ? `${hiring.avgReviewDays} days` : "—",
      ],
      ["CODEOWNERS", hiring.codeownersPresent ? chalk.green("✓") : chalk.red("✗")]
    );
    console.log(hiringTable.toString());
  }

  console.log(chalk.dim(`\nProbed on ${new Date(report.probeDate).toLocaleString()}`));
}
