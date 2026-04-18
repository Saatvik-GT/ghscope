# ghscope

A CLI that gives you a full intelligence report on any GitHub organization — before you contribute, apply, or invest time there.

Most developers waste hours manually digging through repos, reading stale READMEs, and guessing which issues are worth picking up. `ghscope` does that work in seconds: stack fingerprint, repo health, and ranked contribution opportunities, all from your terminal.

---

## What it does

```
ghscope analyze supabase
```

```
Analyzing supabase...

STACK FINGERPRINT
  Primary languages    TypeScript (67%)  Go (21%)  Rust (8%)
  Frameworks           Next.js  Deno  PostgREST
  CI/CD                GitHub Actions
  Monorepo             Yes

REPO HEALTH
  Total repos          87
  Active (last 30d)    23
  Avg PR close time    2.3 days

CONTRIBUTION OPPORTUNITIES
  #4521  good-first-issue   Add TypeScript types for auth helpers       matched
  #3892  help-wanted        Fix pagination in realtime client           matched
  #4103  good-first-issue   Improve error messages in CLI              matched
```

---

## Installation

```bash
npm install -g ghscope
```

Or run directly without installing:

```bash
npx ghscope analyze <org>
```

---

## Setup

`ghscope` uses the GitHub API. Without a token, you will hit rate limits quickly on large orgs.

1. Generate a personal access token at [github.com/settings/tokens](https://github.com/settings/tokens). No special scopes are required for public org data.

2. Set it as an environment variable:

```bash
export GITHUB_TOKEN=your_token_here
```

Or create a `.env` file in your working directory:

```
GITHUB_TOKEN=your_token_here
```

---

## Usage

### Analyze an org

```bash
ghscope analyze <org>
```

Fetches all public repos, detects the tech stack, scores repo health, and surfaces open contribution opportunities.

### Filter by your skills

```bash
ghscope analyze <org> --skills typescript,react,node
```

Ranks contribution opportunities by how closely the issue matches your listed skills.

### Examples

```bash
ghscope analyze vercel
ghscope analyze supabase --skills typescript,postgres
ghscope analyze calcom --skills react,trpc
```

---

## How it works

**Stack detection** goes beyond language percentages. `ghscope` scans `package.json`, CI config files, and tooling configs across all repos to identify frameworks, build tools, test runners, and deployment targets in use across the org — not just what the README claims.

**Repo health scoring** looks at commit recency, PR velocity, issue response time, and the presence of contribution guides. It tells you whether a repo is actively maintained or effectively abandoned before you spend time on it.

**Contribution matching** pulls all open issues tagged `good-first-issue` or `help-wanted` across the entire org and ranks them against your declared skills. You get the highest-signal issues first, not a flat list of everything.

---

## Built with

- [`@octokit/rest`](https://github.com/octokit/rest.js) — GitHub API client
- [`commander`](https://github.com/tj/commander.js) — CLI argument parsing
- [`chalk`](https://github.com/chalk/chalk) — terminal output formatting
- [`cli-table3`](https://github.com/cli-table/cli-table3) — table rendering
- [`ora`](https://github.com/sindresorhus/ora) — loading spinners
- TypeScript + [`tsup`](https://github.com/egoist/tsup) for build

---

## Roadmap

- `--profile <github-username>` — compare your contribution history against the org's codebase to identify your best entry points
- Contributor graph analysis — surface orphaned areas of the codebase with no active maintainer
- PR pattern analysis — understand the review culture and how responsive maintainers are to first-time contributors
- `ghscope compare <org1> <org2>` — side-by-side comparison of two orgs

---

## Contributing

Issues and PRs are welcome. If you find a bug or want to suggest a feature, open an issue first so we can discuss the approach before implementation.

---

## License

MIT
