import { Octokit } from "@octokit/rest";
import type { Repo } from "./types.js";

let client: Octokit | null = null;

export function getClient(verbose = false): Octokit {
  if (client) return client;

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error(
      "\nError: GITHUB_TOKEN environment variable is not set.\n" +
        "Generate a token at: https://github.com/settings/tokens\n" +
        "Then run: export GITHUB_TOKEN=your_token_here\n"
    );
    process.exit(1);
  }

  client = new Octokit({ auth: token });

  if (verbose) {
    client.hook.after("request", async (response) => {
      const remaining = response.headers["x-ratelimit-remaining"];
      if (remaining && parseInt(remaining) < 100) {
        console.warn(`\nWarning: Only ${remaining} GitHub API requests remaining.`);
      }
    });
  }

  return client;
}

export async function listRepos(org: string, top: number, verbose = false): Promise<Repo[]> {
  const octokit = getClient(verbose);
  const repos: Repo[] = [];

  for await (const response of octokit.paginate.iterator(octokit.rest.repos.listForOrg, {
    org,
    type: "public",
    sort: "stars",
    direction: "desc",
    per_page: 100,
  })) {
    repos.push(...(response.data as Repo[]));
    if (repos.length >= top) break;
  }

  return repos.slice(0, top).filter((r) => !r.archived);
}

export async function getLanguages(owner: string, repo: string): Promise<Record<string, number>> {
  const octokit = getClient();
  try {
    const { data } = await octokit.rest.repos.listLanguages({ owner, repo });
    return data as Record<string, number>;
  } catch {
    return {};
  }
}

export async function getContents(owner: string, repo: string, path: string): Promise<string | null> {
  const octokit = getClient();
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
    if (Array.isArray(data)) return "directory";
    if ("content" in data && data.content) {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
    return null;
  }
}

export async function searchIssues(query: string): Promise<number> {
  const octokit = getClient();
  try {
    const { data } = await octokit.rest.search.issuesAndPullRequests({
      q: query,
      per_page: 1,
    });
    return data.total_count;
  } catch {
    return 0;
  }
}

export async function listClosedPRs(owner: string, repo: string, perPage = 50) {
  const octokit = getClient();
  try {
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "closed",
      per_page: perPage,
      sort: "updated",
      direction: "desc",
    });
    return data;
  } catch {
    return [];
  }
}

export async function listIssues(owner: string, repo: string, perPage = 30) {
  const octokit = getClient();
  try {
    const { data } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: "open",
      per_page: perPage,
    });
    return data.filter((i) => !i.pull_request);
  } catch {
    return [];
  }
}

export async function listIssueComments(owner: string, repo: string, issueNumber: number) {
  const octokit = getClient();
  try {
    const { data } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: issueNumber,
      per_page: 1,
    });
    return data;
  } catch {
    return [];
  }
}

export async function listContributors(owner: string, repo: string) {
  const octokit = getClient();
  try {
    const { data } = await octokit.rest.repos.listContributors({
      owner,
      repo,
      per_page: 100,
    });
    return data;
  } catch {
    return [];
  }
}

export async function listReleases(owner: string, repo: string, perPage = 100) {
  const octokit = getClient();
  try {
    const { data } = await octokit.rest.repos.listReleases({
      owner,
      repo,
      per_page: perPage,
    });
    return data;
  } catch {
    return [];
  }
}

export async function listPRReviews(owner: string, repo: string, pullNumber: number) {
  const octokit = getClient();
  try {
    const { data } = await octokit.rest.pulls.listReviews({
      owner,
      repo,
      pull_number: pullNumber,
    });
    return data;
  } catch {
    return [];
  }
}
