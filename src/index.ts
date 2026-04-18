#!/usr/bin/env node
import { Command } from "commander";
import ora from "ora";
import { listRepos } from "./github.js";
import { analyzeStack } from "./analyzers/stack.js";
import { analyzeHealth } from "./analyzers/health.js";
import { analyzeContribution } from "./analyzers/contribution.js";
import { analyzeHiring } from "./analyzers/hiring.js";
import { buildReport } from "./scorer.js";
import { renderTable } from "./renderer/table.js";
import { renderJSON } from "./renderer/json.js";
import { renderMarkdown } from "./renderer/markdown.js";
import type { CLIOptions } from "./types.js";

const program = new Command();

program
  .name("ghscope")
  .description("Everything a developer needs to know about a GitHub org before contributing or applying")
  .version("0.1.0")
  .argument("<org>", "GitHub organization name")
  .option("-f, --format <format>", "output format: table | json | markdown", "table")
  .option("-t, --top <n>", "number of top repos to analyze", "20")
  .option("--hire", "include hiring signals section", false)
  .option("--verbose", "show API rate limit info", false)
  .action(async (org: string, opts: { format: string; top: string; hire: boolean; verbose: boolean }) => {
    const options: CLIOptions = {
      format: opts.format as CLIOptions["format"],
      top: parseInt(opts.top, 10),
      hire: opts.hire,
      verbose: opts.verbose,
    };

    const spinner = ora(`Probing github/${org}...`).start();

    try {
      const repos = await listRepos(org, options.top, options.verbose);

      if (repos.length === 0) {
        spinner.fail(`No public repositories found for org: ${org}`);
        process.exit(1);
      }

      spinner.text = `Analyzing ${repos.length} repos...`;

      const [stack, health, contribution] = await Promise.all([
        analyzeStack(org, repos),
        analyzeHealth(org, repos),
        analyzeContribution(org, repos),
      ]);

      const hiring = options.hire ? await analyzeHiring(org, repos) : null;

      spinner.succeed(`Done — github/${org} (${repos.length} repos analyzed)`);

      const report = buildReport(org, stack, health, contribution, hiring);

      if (options.format === "json") {
        renderJSON(report);
      } else if (options.format === "markdown") {
        renderMarkdown(report, options.hire);
      } else {
        renderTable(report, options.hire);
      }
    } catch (err: unknown) {
      spinner.fail("Analysis failed");
      const msg = err instanceof Error ? err.message : String(err);
      console.error(msg);
      process.exit(1);
    }
  });

program.parse();
