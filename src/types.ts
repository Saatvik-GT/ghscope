export interface Repo {
  name: string;
  full_name: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
  language: string | null;
  languages_url: string;
  default_branch: string;
  archived: boolean;
}

export interface StackResult {
  languages: Array<{ name: string; bytes: number; percent: number }>;
  cicd: string[];
  frameworks: string[];
}

export interface HealthResult {
  healthScore: number;
  totalRepos: number;
  staleCount: number;
  hasContributing: boolean;
  hasLicense: boolean;
  avgOpenIssues: number;
}

export interface ContributionResult {
  readinessScore: number;
  gfiCount: number;
  helpWantedCount: number;
  prMergeRate: number;
  avgResponseHours: number | null;
  hasTemplates: boolean;
}

export interface HiringResult {
  busFactorRisk: "low" | "medium" | "high";
  releaseCadence: "weekly" | "monthly" | "sporadic" | "none";
  avgReviewDays: number | null;
  teamSize: number;
  codeownersPresent: boolean;
  releasesLastYear: number;
}

export interface OrgReport {
  org: string;
  probeDate: string;
  stack: StackResult;
  health: HealthResult;
  contribution: ContributionResult;
  hiring: HiringResult | null;
}

export interface CLIOptions {
  format: "table" | "json" | "markdown";
  top: number;
  hire: boolean;
  verbose: boolean;
}
