/**
 * Fetches GitHub OSS PR contributions made by bamlab org members.
 * Filters: external repos only, JS/TS-only, >=50 stars, exclude client orgs, no self-owned, >=2020.
 * Writes the result to public/prs.json.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx bun scripts/fetch-prs.ts
 *
 * In CI the workflow provides GITHUB_TOKEN.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import type { PrRecord, RepoMeta, PersonStat, PrsDataFile, PrState } from '../src/types';

const ORG = 'bamlab';
const STAR_THRESHOLD = 50;
const MIN_YEAR = 2020;
// Owners we treat as client/business/internal (not true OSS ecosystem).
const EXCLUDED_ORGS = new Set([
  'pass-culture',
  'ReliefApplications',
  'theodo-group',
  'Theodo-UK',
  'sicara',
  // AI-focused orgs — excluded as a category by request
  'langchain-ai',
  'pAIrprogio',
]);
// Individual repos to exclude (own/personal noise or AI not covered by an org).
const EXCLUDED_REPOS = new Set([
  'adechassey/blueprints',
  'microsoft/genaiscript',
  'WebDevSimplified/chat-gpt-api',
  'numerique-gouv/blocknote-llm',
]);
const ALLOWED_LANGUAGES = new Set(['TypeScript', 'JavaScript']);
// Authors to exclude from the leaderboard (former members, etc.).
const EXCLUDED_AUTHORS = new Set(['pierrezimmermannbam']);
// Repos inside the bamlab org that are real OSS libraries and should be included
// even though we exclude bamlab/* by default. Bypasses language/star thresholds.
const BAMLAB_WHITELIST = new Set([
  'bamlab/react-native-enablers',
  'bamlab/react-native-project-config',
  'bamlab/react-native-app-security',
  'bamlab/flashlight',
  'bamlab/dev-plugins',
]);

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.warn('No GITHUB_TOKEN set — search/REST quotas will be very low.');
}

const ghHeaders: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};
if (token) ghHeaders['Authorization'] = `Bearer ${token}`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ghFetch<T>(url: string, attempt = 1): Promise<T> {
  const res = await fetch(url, { headers: ghHeaders });
  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get('x-ratelimit-reset');
    const retryAfter = res.headers.get('retry-after');
    let waitMs = 30_000 * attempt;
    if (retryAfter) waitMs = Math.max(waitMs, Number(retryAfter) * 1000);
    if (reset) {
      const ms = Math.max(0, Number(reset) * 1000 - Date.now()) + 2000;
      waitMs = Math.max(waitMs, ms);
    }
    if (attempt > 4) throw new Error(`Rate-limited after ${attempt} attempts: ${url}`);
    console.warn(`  rate-limited (${res.status}); sleeping ${Math.round(waitMs / 1000)}s (attempt ${attempt})`);
    await sleep(waitMs);
    return ghFetch<T>(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText} for ${url}`);
  return (await res.json()) as T;
}

async function fetchOrgMembers(org: string): Promise<string[]> {
  const members: string[] = [];
  let page = 1;
  while (true) {
    const data = await ghFetch<Array<{ login: string }>>(
      `https://api.github.com/orgs/${org}/members?per_page=100&page=${page}`
    );
    if (data.length === 0) break;
    for (const m of data) members.push(m.login);
    if (data.length < 100) break;
    page += 1;
  }
  return members;
}

interface SearchItem {
  title: string;
  html_url: string;
  created_at: string;
  state: 'open' | 'closed';
  pull_request?: { merged_at: string | null };
  repository_url: string;
  user: { login: string };
}

interface SearchResp {
  total_count: number;
  incomplete_results: boolean;
  items: SearchItem[];
}

async function searchPrsInRepo(repo: string): Promise<PrRecord[]> {
  const records: PrRecord[] = [];
  const q = encodeURIComponent(`repo:${repo} type:pr is:public`);
  let page = 1;
  while (true) {
    const url = `https://api.github.com/search/issues?q=${q}&advanced_search=true&per_page=100&page=${page}`;
    const data = await ghFetch<SearchResp>(url);
    for (const item of data.items) {
      const state: PrState = item.pull_request?.merged_at
        ? 'merged'
        : item.state === 'open'
        ? 'open'
        : 'closed';
      records.push({
        author: item.user.login,
        repo,
        state,
        createdAt: item.created_at,
        title: item.title,
        url: item.html_url,
      });
    }
    if (data.items.length < 100) break;
    if (page >= 10) break;
    page += 1;
    await sleep(800);
  }
  return records;
}

async function searchIssuesInRepo(repo: string): Promise<PrRecord[]> {
  const records: PrRecord[] = [];
  const q = encodeURIComponent(`repo:${repo} type:issue is:public`);
  let page = 1;
  while (true) {
    const url = `https://api.github.com/search/issues?q=${q}&advanced_search=true&per_page=100&page=${page}`;
    const data = await ghFetch<SearchResp>(url);
    for (const item of data.items) {
      records.push({
        author: item.user.login,
        repo,
        state: item.state === 'open' ? 'open' : 'closed',
        createdAt: item.created_at,
        title: item.title,
        url: item.html_url,
      });
    }
    if (data.items.length < 100) break;
    if (page >= 10) break;
    page += 1;
    await sleep(800);
  }
  return records;
}

async function searchIssues(author: string): Promise<PrRecord[]> {
  const records: PrRecord[] = [];
  const q = encodeURIComponent(`author:${author} type:issue is:public -org:${ORG}`);
  let page = 1;
  while (true) {
    const url = `https://api.github.com/search/issues?q=${q}&advanced_search=true&per_page=100&page=${page}`;
    let data: SearchResp;
    try {
      data = await ghFetch<SearchResp>(url);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('422')) return records;
      throw err;
    }
    for (const item of data.items) {
      const repo = item.repository_url.replace('https://api.github.com/repos/', '');
      records.push({
        author,
        repo,
        state: item.state === 'open' ? 'open' : 'closed',
        createdAt: item.created_at,
        title: item.title,
        url: item.html_url,
      });
    }
    if (data.items.length < 100) break;
    if (page >= 10) break; // search caps at 1000 results
    page += 1;
    await sleep(800);
  }
  return records;
}

async function searchPrs(author: string): Promise<PrRecord[]> {
  const records: PrRecord[] = [];
  const q = encodeURIComponent(`author:${author} type:pr is:public -org:${ORG}`);
  let page = 1;
  while (true) {
    const url = `https://api.github.com/search/issues?q=${q}&advanced_search=true&per_page=100&page=${page}`;
    let data: SearchResp;
    try {
      data = await ghFetch<SearchResp>(url);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('422')) {
        // Some accounts get rejected by search ("user does not exist or cannot be searched")
        return records;
      }
      throw err;
    }
    for (const item of data.items) {
      const repo = item.repository_url.replace('https://api.github.com/repos/', '');
      const state: PrState = item.pull_request?.merged_at
        ? 'merged'
        : item.state === 'open'
        ? 'open'
        : 'closed';
      records.push({
        author,
        repo,
        state,
        createdAt: item.created_at,
        title: item.title,
        url: item.html_url,
      });
    }
    if (data.items.length < 100) break;
    if (page >= 10) break; // search caps at 1000 results
    page += 1;
    await sleep(800);
  }
  return records;
}

interface RepoApi {
  full_name: string;
  language: string | null;
  stargazers_count: number;
  owner: { login: string };
}

async function fetchRepoMeta(fullName: string): Promise<RepoMeta | null> {
  try {
    const data = await ghFetch<RepoApi>(`https://api.github.com/repos/${fullName}`);
    return {
      name: data.full_name,
      owner: data.owner.login,
      language: data.language,
      stars: data.stargazers_count,
    };
  } catch (err) {
    console.warn(`  repo meta failed for ${fullName}: ${(err as Error).message}`);
    return null;
  }
}

// Fraction of a repo's bytes that must be JS/TS for it to count as part of the
// ecosystem when GitHub's *primary* language is something else (e.g. Kotlin for
// React Native native modules like react-native-keychain).
const JS_SHARE_THRESHOLD = 0.2;

async function fetchJsTsShare(fullName: string): Promise<number> {
  try {
    const data = await ghFetch<Record<string, number>>(
      `https://api.github.com/repos/${fullName}/languages`
    );
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (!total) return 0;
    const jsts = (data.TypeScript ?? 0) + (data.JavaScript ?? 0);
    return jsts / total;
  } catch (err) {
    console.warn(`  languages failed for ${fullName}: ${(err as Error).message}`);
    return 0;
  }
}

function isExcluded(repo: string): boolean {
  if (BAMLAB_WHITELIST.has(repo)) return false;
  const owner = repo.split('/')[0];
  if (EXCLUDED_ORGS.has(owner)) return true;
  if (EXCLUDED_REPOS.has(repo)) return true;
  return false;
}

const MIN_EXPECTED_MEMBERS = 20;

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = join(__dirname, '../public/prs.json');

  console.log(`Fetching members of ${ORG}...`);
  const members = await fetchOrgMembers(ORG);
  console.log(`  ${members.length} members`);

  if (members.length < MIN_EXPECTED_MEMBERS) {
    console.error(
      `\nERROR: only ${members.length} members visible — the token likely lacks the read:org scope ` +
        `or is not a member of ${ORG}. ` +
        `Add a PAT secret named OSS_VISUALIZER_TOKEN (read:org + public_repo) ` +
        `and set GITHUB_TOKEN to it in the workflow. ` +
        `Aborting without overwriting the existing prs.json.`
    );
    process.exit(2);
  }

  console.log('\nFetching PRs and issues per member (external to bamlab)...');
  const rawPrs: PrRecord[] = [];
  const rawIssues: PrRecord[] = [];
  for (const login of members) {
    try {
      const prs = await searchPrs(login);
      rawPrs.push(...prs);
      await sleep(1500); // be gentle with secondary rate limits
      const issues = await searchIssues(login);
      rawIssues.push(...issues);
      console.log(`  ${login}: ${prs.length} PRs, ${issues.length} issues`);
      await sleep(1500);
    } catch (err) {
      console.error(`  ${login}: ERROR — ${(err as Error).message}`);
    }
  }

  console.log('\nFetching PRs and issues in whitelisted bamlab OSS repos...');
  const memberSet = new Set(members.map((m) => m.toLowerCase()));
  for (const repo of BAMLAB_WHITELIST) {
    try {
      const prs = await searchPrsInRepo(repo);
      const fromMembers = prs.filter((p) => memberSet.has(p.author.toLowerCase()));
      rawPrs.push(...fromMembers);
      await sleep(1500);
      const issues = await searchIssuesInRepo(repo);
      const issuesFromMembers = issues.filter((p) => memberSet.has(p.author.toLowerCase()));
      rawIssues.push(...issuesFromMembers);
      console.log(
        `  ${repo}: ${fromMembers.length} PRs, ${issuesFromMembers.length} issues (from members)`,
      );
      await sleep(1500);
    } catch (err) {
      console.error(`  ${repo}: ERROR — ${(err as Error).message}`);
    }
  }

  // Pre-filter: drop excluded authors/orgs/repos, self-owned, pre-2020, closed-not-merged
  const filtered1 = rawPrs.filter((pr) => {
    if (EXCLUDED_AUTHORS.has(pr.author)) return false;
    const owner = pr.repo.split('/')[0];
    if (isExcluded(pr.repo)) return false;
    if (owner.toLowerCase() === pr.author.toLowerCase()) return false;
    if (Number(pr.createdAt.slice(0, 4)) < MIN_YEAR) return false;
    if (pr.state === 'closed') return false; // keep merged + open only
    return true;
  });

  // Same pre-filter for issues, but keep both open and closed (an opened issue
  // is a contribution regardless of whether it was later closed).
  const filteredIssues1 = rawIssues.filter((issue) => {
    if (EXCLUDED_AUTHORS.has(issue.author)) return false;
    const owner = issue.repo.split('/')[0];
    if (isExcluded(issue.repo)) return false;
    if (owner.toLowerCase() === issue.author.toLowerCase()) return false;
    if (Number(issue.createdAt.slice(0, 4)) < MIN_YEAR) return false;
    return true;
  });

  // Fetch repo metadata for the surviving repo set (PRs + issues)
  const uniqueRepos = Array.from(
    new Set([...filtered1.map((p) => p.repo), ...filteredIssues1.map((i) => i.repo)]),
  );
  console.log(`\nFetching metadata for ${uniqueRepos.length} candidate repos...`);
  const repoMetas: RepoMeta[] = [];
  for (let i = 0; i < uniqueRepos.length; i++) {
    const meta = await fetchRepoMeta(uniqueRepos[i]);
    if (meta) repoMetas.push(meta);
    if ((i + 1) % 25 === 0) {
      console.log(`  ${i + 1}/${uniqueRepos.length} repos`);
      await sleep(1000);
    }
  }
  const repoByName = new Map(repoMetas.map((r) => [r.name, r] as const));

  // Determine which candidate repos qualify as JS/TS ecosystem. The primary
  // `language` is often a native lang (Kotlin/Swift/ObjC) for RN modules that
  // are still largely JS/TS, so for star-passing repos that fail the primary
  // check we fall back to the language byte breakdown.
  const qualifying = new Set<string>();
  let langChecks = 0;
  for (const repo of uniqueRepos) {
    const meta = repoByName.get(repo);
    if (!meta || meta.stars < STAR_THRESHOLD) continue;
    if (meta.language && ALLOWED_LANGUAGES.has(meta.language)) {
      qualifying.add(repo);
      continue;
    }
    const share = await fetchJsTsShare(repo);
    if (share >= JS_SHARE_THRESHOLD) qualifying.add(repo);
    if (++langChecks % 25 === 0) await sleep(1000);
  }

  // Final filter: JS/TS + star threshold (bypassed for whitelisted bamlab OSS repos)
  const finalPrs = filtered1.filter((pr) => {
    if (BAMLAB_WHITELIST.has(pr.repo)) return true;
    return qualifying.has(pr.repo);
  });
  const finalIssues = filteredIssues1.filter((issue) => {
    if (BAMLAB_WHITELIST.has(issue.repo)) return true;
    return qualifying.has(issue.repo);
  });

  // Compute leaderboard. prCount/reposCount/topRepos stay PR-based (preserving
  // their existing meaning); issueCount is the secondary "silver medal" factor.
  const counts = new Map<
    string,
    { prCount: number; issueCount: number; repos: Set<string> }
  >();
  const entryFor = (login: string) => {
    let entry = counts.get(login);
    if (!entry) {
      entry = { prCount: 0, issueCount: 0, repos: new Set<string>() };
      counts.set(login, entry);
    }
    return entry;
  };
  for (const pr of finalPrs) {
    const entry = entryFor(pr.author);
    entry.prCount += 1;
    entry.repos.add(pr.repo);
  }
  for (const issue of finalIssues) {
    entryFor(issue.author).issueCount += 1;
  }
  const people: PersonStat[] = Array.from(counts.entries())
    .map(([login, e]) => ({
      login,
      prCount: e.prCount,
      issueCount: e.issueCount,
      reposCount: e.repos.size,
      topRepos: Array.from(e.repos).slice(0, 5),
    }))
    // Primary: PRs (gold). Secondary tie-breaker: issues opened (silver).
    .sort((a, b) => b.prCount - a.prCount || b.issueCount - a.issueCount);

  const finalRepos = repoMetas.filter(
    (r) => finalPrs.some((p) => p.repo === r.name) || finalIssues.some((i) => i.repo === r.name),
  );

  const out: PrsDataFile = {
    generatedAt: new Date().toISOString(),
    org: ORG,
    prs: finalPrs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    issues: finalIssues.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    repos: finalRepos.sort((a, b) => b.stars - a.stars),
    people,
  };

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`\nDone.`);
  console.log(`  PRs kept:       ${finalPrs.length}`);
  console.log(`  Issues kept:    ${finalIssues.length}`);
  console.log(`  Repos kept:     ${finalRepos.length}`);
  console.log(`  Contributors:   ${people.length}`);
  console.log(`  Written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
