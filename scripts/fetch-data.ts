/**
 * Fetches npm download stats, registry metadata, and GitHub stars for all packages.
 * Also fetches pub.dev (Flutter/Dart) packages for the bam.tech publisher.
 * Writes the result to public/data.json.
 *
 * Usage:
 *   bun scripts/fetch-data.ts
 *
 * Set GITHUB_TOKEN env var for higher GitHub API rate limits (optional but recommended in CI).
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { PACKAGES } from '../src/constants/packages';
import { fetchDownloads, fetchRegistry, NotFoundError } from '../src/lib/npmApi';
import { fetchStars } from '../src/lib/githubApi';
import {
  bucketByMonth,
  calcMoMGrowth,
  dropCurrentMonth,
  parseGitHubOwnerRepo,
  stripHtml,
} from '../src/lib/dataUtils';
import {
  fetchPubPublisherPackages,
  fetchPubPackageInfo,
  fetchPubScore,
} from '../src/lib/pubApi';
import type { PackageData, DataFile, MonthlyDownload } from '../src/types';

const githubToken = process.env.GITHUB_TOKEN;

async function processNpmPackage(name: string): Promise<PackageData> {
  const [dlResult, regResult] = await Promise.allSettled([
    fetchDownloads(name),
    fetchRegistry(name),
  ]);

  const notFound =
    (dlResult.status === 'rejected' && dlResult.reason instanceof NotFoundError) ||
    (regResult.status === 'rejected' && regResult.reason instanceof NotFoundError);

  if (notFound) {
    return {
      name,
      totalDownloads: 0,
      monthlyDownloads: [],
      momGrowthPct: null,
      isGrowing: false,
      stars: null,
      description: null,
      notFound: true,
      ecosystem: 'npm',
    };
  }

  const daily = dlResult.status === 'fulfilled' ? dlResult.value.downloads : [];
  const allMonthly = bucketByMonth(daily);
  const totalDownloads = daily.reduce((sum, d) => sum + d.downloads, 0);
  const momGrowthPct = calcMoMGrowth(allMonthly);

  const regData = regResult.status === 'fulfilled' ? regResult.value : null;
  const rawDescription = regData?.description ?? null;

  let stars: number | null = null;
  const ghRef = parseGitHubOwnerRepo(regData?.repository?.url);
  if (ghRef) {
    const starResult = await Promise.allSettled([fetchStars(ghRef.owner, ghRef.repo, githubToken)]);
    if (starResult[0].status === 'fulfilled') {
      stars = starResult[0].value;
    }
  }

  return {
    name,
    totalDownloads,
    monthlyDownloads: dropCurrentMonth(allMonthly),
    momGrowthPct,
    isGrowing: momGrowthPct !== null && momGrowthPct > 10,
    stars,
    description: rawDescription ? stripHtml(rawDescription) : null,
    notFound: false,
    ecosystem: 'npm',
  };
}

async function processPubPackage(name: string, existingMonthly: MonthlyDownload[]): Promise<PackageData> {
  const [infoResult, scoreResult] = await Promise.allSettled([
    fetchPubPackageInfo(name),
    fetchPubScore(name),
  ]);

  if (infoResult.status === 'rejected') {
    return {
      name,
      totalDownloads: 0,
      monthlyDownloads: [],
      momGrowthPct: null,
      isGrowing: false,
      stars: null,
      description: null,
      notFound: true,
      ecosystem: 'pub',
    };
  }

  const info = infoResult.value;
  const score = scoreResult.status === 'fulfilled' ? scoreResult.value : null;
  const count30d = score?.downloadCount30Days ?? 0;

  // pub.dev only exposes a 30-day rolling count. Store it as the last complete month
  // and merge with any previously accumulated months so history builds up over time.
  const today = new Date();
  const lastCompleteMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 7);

  const monthMap = new Map<string, number>(existingMonthly.map((m) => [m.month, m.downloads]));
  if (count30d > 0) {
    monthMap.set(lastCompleteMonth, count30d);
  }
  const monthlyDownloads: MonthlyDownload[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, downloads]) => ({ month, downloads }));

  const totalDownloads = monthlyDownloads.reduce((sum, m) => sum + m.downloads, 0);
  const momGrowthPct = calcMoMGrowth(monthlyDownloads);

  let stars: number | null = null;
  const ghRef = parseGitHubOwnerRepo(info.repositoryUrl ?? undefined);
  if (ghRef) {
    const starResult = await Promise.allSettled([fetchStars(ghRef.owner, ghRef.repo, githubToken)]);
    if (starResult[0].status === 'fulfilled') {
      stars = starResult[0].value;
    }
  }

  return {
    name,
    totalDownloads,
    monthlyDownloads,
    momGrowthPct,
    isGrowing: momGrowthPct !== null && momGrowthPct > 10,
    stars,
    description: info.description,
    notFound: false,
    ecosystem: 'pub',
    publishedAt: info.publishedAt,
  };
}

async function main() {
  // Load existing data.json to preserve accumulated pub.dev monthly history
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = join(__dirname, '../public/data.json');
  let existingPubData = new Map<string, MonthlyDownload[]>();
  try {
    const raw = readFileSync(outPath, 'utf-8');
    const existing: DataFile = JSON.parse(raw);
    for (const pkg of existing.packages) {
      if (pkg.ecosystem === 'pub' && pkg.monthlyDownloads.length > 0) {
        existingPubData.set(pkg.name, pkg.monthlyDownloads);
      }
    }
    console.log(`Loaded ${existingPubData.size} existing pub.dev package histories from data.json`);
  } catch {
    console.log('No existing data.json found — starting fresh');
  }

  // Fetch pub.dev package list for bam.tech publisher
  console.log('Fetching pub.dev packages for bam.tech...');
  let pubPackages: string[] = [];
  try {
    pubPackages = await fetchPubPublisherPackages('bam.tech');
    console.log(`  Found ${pubPackages.length} pub.dev packages`);
  } catch (err) {
    console.error(`  pub.dev publisher fetch failed: ${(err as Error).message}`);
  }

  console.log(`\nFetching data for ${PACKAGES.length} npm packages...`);
  const npmResults = await Promise.all(
    PACKAGES.map(async (name) => {
      try {
        const result = await processNpmPackage(name);
        const status = result.notFound
          ? '✗ not found'
          : `✓ ${(result.totalDownloads / 1000).toFixed(0)}K downloads`;
        console.log(`  ${name}: ${status}`);
        return result;
      } catch (err) {
        console.error(`  ${name}: ERROR — ${(err as Error).message}`);
        return {
          name,
          totalDownloads: 0,
          monthlyDownloads: [],
          momGrowthPct: null,
          isGrowing: false,
          stars: null,
          description: null,
          notFound: true,
          ecosystem: 'npm',
        } satisfies PackageData;
      }
    })
  );

  console.log(`\nFetching data for ${pubPackages.length} pub.dev packages...`);
  const pubResults = await Promise.all(
    pubPackages.map(async (name) => {
      try {
        const result = await processPubPackage(name, existingPubData.get(name) ?? []);
        const status = result.notFound
          ? '✗ not found'
          : `✓ ${(result.totalDownloads / 1000).toFixed(0)}K downloads`;
        console.log(`  ${name}: ${status}`);
        return result;
      } catch (err) {
        console.error(`  ${name}: ERROR — ${(err as Error).message}`);
        return {
          name,
          totalDownloads: 0,
          monthlyDownloads: [],
          momGrowthPct: null,
          isGrowing: false,
          stars: null,
          description: null,
          notFound: true,
          ecosystem: 'pub',
        } satisfies PackageData;
      }
    })
  );

  const packages = [...npmResults, ...pubResults];

  const output: DataFile = {
    generatedAt: new Date().toISOString(),
    packages,
  };

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  const npmTotal = npmResults.reduce((sum, p) => sum + p.totalDownloads, 0);
  const pubTotal = pubResults.reduce((sum, p) => sum + p.totalDownloads, 0);
  console.log(`\nDone.`);
  console.log(`  npm total:     ${(npmTotal / 1_000_000).toFixed(2)}M downloads`);
  console.log(`  pub.dev total: ${(pubTotal / 1_000).toFixed(0)}K downloads`);
  console.log(`Written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
