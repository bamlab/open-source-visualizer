import { useState, useEffect, useMemo } from 'react';
import type { PrRecord, RepoMeta } from '../types';
import { useSelectedPerson } from '../store/selectedPerson';

interface Props {
  prs: PrRecord[];
  repos: RepoMeta[];
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const day = 86400000;
  if (ms < day) return 'today';
  if (ms < 7 * day) return `${Math.floor(ms / day)}d ago`;
  if (ms < 30 * day) return `${Math.floor(ms / (7 * day))}w ago`;
  if (ms < 365 * day) return `${Math.floor(ms / (30 * day))}mo ago`;
  return `${Math.floor(ms / (365 * day))}y ago`;
}

function monthToOrdinal(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return y * 12 + (m - 1);
}

// For each PR by this author, return its 1-based position within an active
// streak group. A "streak group" is a maximal run of consecutive calendar
// months where each month has ≥2 PRs by this author. PRs in qualifying
// months get an index counting from the start of their group; PRs in
// non-qualifying months get 0. The first PR of a group is 1 (no badge);
// subsequent PRs in the group are 2, 3, … and show "🔥 Streak of N".
function computeStreakIndices(authorPrs: PrRecord[]): Map<string, number> {
  const sorted = [...authorPrs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const countByMonth = new Map<string, number>();
  for (const pr of sorted) {
    const m = pr.createdAt.slice(0, 7);
    countByMonth.set(m, (countByMonth.get(m) ?? 0) + 1);
  }

  const result = new Map<string, number>();
  let lastMonth: string | null = null;
  let runningIndex = 0;
  for (const pr of sorted) {
    const m = pr.createdAt.slice(0, 7);
    const qualifies = (countByMonth.get(m) ?? 0) >= 2;
    if (!qualifies) {
      result.set(pr.url, 0);
      lastMonth = null;
      runningIndex = 0;
      continue;
    }
    if (lastMonth === null) {
      runningIndex = 1;
    } else if (lastMonth === m) {
      runningIndex += 1;
    } else if (monthToOrdinal(m) === monthToOrdinal(lastMonth) + 1) {
      runningIndex += 1;
    } else {
      runningIndex = 1; // gap → new group
    }
    result.set(pr.url, runningIndex);
    lastMonth = m;
  }
  return result;
}

const STATE_STYLE: Record<string, string> = {
  merged: 'bg-purple-100 text-purple-700',
  open: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

export function LatestPrs({ prs, repos }: Props) {
  const [visible, setVisible] = useState(20);
  const { selectedPerson, clear } = useSelectedPerson();

  useEffect(() => {
    setVisible(20);
  }, [selectedPerson]);

  const repoMap = useMemo(
    () => new Map<string, RepoMeta>(repos.map((r) => [r.name, r])),
    [repos],
  );

  // Per-PR streak index across all PRs (not just the filtered subset),
  // since the streak depends on the author's full history.
  const streakByPrUrl = useMemo(() => {
    const byAuthor = new Map<string, PrRecord[]>();
    for (const pr of prs) {
      const list = byAuthor.get(pr.author) ?? [];
      list.push(pr);
      byAuthor.set(pr.author, list);
    }
    const merged = new Map<string, number>();
    for (const [, list] of byAuthor) {
      for (const [url, idx] of computeStreakIndices(list)) merged.set(url, idx);
    }
    return merged;
  }, [prs]);

  const filteredPrs = selectedPerson
    ? prs.filter((pr) => pr.author === selectedPerson)
    : prs;

  const items = filteredPrs.slice(0, visible);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Latest contributions</h2>
      <p className="text-sm text-gray-500 mb-4">Newest pull requests opened to OSS projects</p>

      {selectedPerson && (
        <div className="bg-red-50 px-3 py-2 rounded-lg flex items-center justify-between text-sm mb-4">
          <span className="text-gray-700">
            Showing contributions by <span className="font-medium">@{selectedPerson}</span>
          </span>
          <button
            onClick={clear}
            className="text-gray-500 hover:text-gray-700 ml-2"
          >
            × clear filter
          </button>
        </div>
      )}

      <ul className="divide-y divide-gray-100">
        {items.map((pr) => {
          const meta = repoMap.get(pr.repo);
          const isBigRepo = meta !== undefined && meta.stars >= 10000;
          const streak = streakByPrUrl.get(pr.url) ?? 0;
          const showStreak = streak >= 2;
          return (
            <li key={pr.url} className="py-3 flex items-start gap-3">
              {/* LEFT: author block — tight, name word-wraps under avatar */}
              <a
                href={`https://github.com/${pr.author}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-start shrink-0 hover:opacity-80 w-14"
              >
                <img
                  src={`https://github.com/${pr.author}.png?size=64`}
                  alt={pr.author}
                  className="w-10 h-10 rounded-md"
                />
                <span
                  className="text-[11px] font-medium text-gray-800 mt-1 hover:text-brand leading-tight"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-all',
                  }}
                >
                  {pr.author}
                </span>
              </a>

              {/* RIGHT: PR content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                      STATE_STYLE[pr.state] ?? STATE_STYLE.closed
                    }`}
                  >
                    {pr.state}
                  </span>
                  {isBigRepo && (
                    <span
                      className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-700"
                      title="Repository has 10k+ GitHub stars"
                    >
                      ⭐ Big repo
                    </span>
                  )}
                  {showStreak && (
                    <span
                      className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-medium"
                      title={`The author's ${streak}th PR in an active streak (consecutive months with 2+ PRs)`}
                    >
                      🔥 Streak of {streak}
                    </span>
                  )}
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-gray-900 hover:text-brand line-clamp-2"
                  >
                    {pr.title}
                  </a>
                </div>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span className="font-mono">{pr.repo}</span>
                  <span>·</span>
                  <span>{timeAgo(pr.createdAt)}</span>
                </div>
              </div>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="py-3 text-sm text-gray-400">
            {selectedPerson
              ? `No contributions found for @${selectedPerson}.`
              : 'No PRs to show.'}
          </li>
        )}
      </ul>

      {visible < filteredPrs.length && (
        <button
          onClick={() => setVisible((v) => v + 20)}
          className="mt-4 mx-auto block px-4 py-2 text-sm font-medium text-brand border border-brand/30 rounded-lg hover:bg-red-50"
        >
          Load more
        </button>
      )}
    </div>
  );
}
