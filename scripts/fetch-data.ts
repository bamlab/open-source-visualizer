/**
 * Fetches npm download stats, registry metadata, and GitHub stars for all packages.
 * Writes the result to public/data.json.
 *
 * Usage:
 *   bun scripts/fetch-data.ts
 *
 * Set GITHUB_TOKEN env var for higher GitHub API rate limits (optional but recommended in CI).
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { PACKAGES } from '../src/constants/packages';
import { fetchDownloads, fetchRegistry, NotFoundError } from '../src/lib/npmApi';
import { fetchStars } from '../src/lib/githubApi';
import { bucketByMonth, calcMoMGrowth, dropCurrentMonth, parseGitHubOwnerRepo, stripHtml } from '../src/lib/dataUtils';
import type { PackageData, DataFile } from '../src/types';

const githubToken = process.env.GITHUB_TOKEN;

async function processPackage(name: string): Promise<PackageData> {
  // Fetch downloads + registry in parallel
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
    };
  }

  const daily = dlResult.status === 'fulfilled' ? dlResult.value.downloads : [];
  const allMonthly = bucketByMonth(daily);
  const totalDownloads = daily.reduce((sum, d) => sum + d.downloads, 0);
  const momGrowthPct = calcMoMGrowth(allMonthly);

  const regData = regResult.status === 'fulfilled' ? regResult.value : null;
  const rawDescription = regData?.description ?? null;

  // Fetch GitHub stars
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
  };
}

async function main() {
  console.log(`Fetching data for ${PACKAGES.length} packages...`);

  const packages = await Promise.all(
    PACKAGES.map(async (name) => {
      try {
        const result = await processPackage(name);
        const status = result.notFound ? '✗ not found' : `✓ ${(result.totalDownloads / 1000).toFixed(0)}K downloads`;
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
        } satisfies PackageData;
      }
    })
  );

  const output: DataFile = {
    generatedAt: new Date().toISOString(),
    packages,
  };

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = join(__dirname, '../public/data.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  const total = packages.reduce((sum, p) => sum + p.totalDownloads, 0);
  console.log(`\nDone. Total: ${(total / 1_000_000).toFixed(2)}M downloads`);
  console.log(`Written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
