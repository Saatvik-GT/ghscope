import { getLanguages, getContents } from "../github.js";
import type { Repo, StackResult } from "../types.js";

const FRAMEWORK_PATTERNS: Record<string, string[]> = {
  "Next.js": ['"next"'],
  React: ['"react"'],
  Vue: ['"vue"'],
  Angular: ['"@angular/core"'],
  Svelte: ['"svelte"'],
  Express: ['"express"'],
  Fastify: ['"fastify"'],
  NestJS: ['"@nestjs/core"'],
  Django: ["django"],
  FastAPI: ["fastapi"],
  Flask: ["flask"],
  Rails: ["rails"],
  Laravel: ["laravel/framework"],
  "Spring Boot": ["spring-boot"],
  Gin: ['"github.com/gin-gonic/gin"'],
  Tokio: ['tokio = "'],
  Axum: ['axum = "'],
};

const CICD_FILES: Record<string, string> = {
  "GitHub Actions": ".github/workflows",
  CircleCI: ".circleci",
  Jenkins: "Jenkinsfile",
  "GitLab CI": ".gitlab-ci.yml",
  Travis: ".travis.yml",
  "Azure Pipelines": "azure-pipelines.yml",
};

const MANIFEST_FILES = ["package.json", "requirements.txt", "go.mod", "Cargo.toml", "Gemfile", "pom.xml"];

export async function analyzeStack(org: string, repos: Repo[]): Promise<StackResult> {
  const langTotals: Record<string, number> = {};

  await Promise.all(
    repos.map(async (repo) => {
      const langs = await getLanguages(org, repo.name);
      for (const [lang, bytes] of Object.entries(langs)) {
        langTotals[lang] = (langTotals[lang] ?? 0) + bytes;
      }
    })
  );

  const totalBytes = Object.values(langTotals).reduce((a, b) => a + b, 0);
  const languages = Object.entries(langTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percent: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
    }));

  const topRepos = repos.slice(0, 5);
  const cicd = await detectCICD(org, topRepos);
  const frameworks = await detectFrameworks(org, topRepos);

  return { languages, cicd, frameworks };
}

async function detectCICD(org: string, repos: Repo[]): Promise<string[]> {
  const detected = new Set<string>();

  await Promise.all(
    repos.map(async (repo) => {
      for (const [name, path] of Object.entries(CICD_FILES)) {
        const content = await getContents(org, repo.name, path);
        if (content !== null) detected.add(name);
      }
    })
  );

  return [...detected];
}

async function detectFrameworks(org: string, repos: Repo[]): Promise<string[]> {
  const detected = new Set<string>();

  await Promise.all(
    repos.map(async (repo) => {
      for (const manifest of MANIFEST_FILES) {
        const content = await getContents(org, repo.name, manifest);
        if (!content || content === "directory") continue;
        for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
          if (patterns.some((p) => content.includes(p))) {
            detected.add(framework);
          }
        }
      }
    })
  );

  return [...detected];
}
