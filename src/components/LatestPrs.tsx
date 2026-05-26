import type { PrRecord } from '../types';

interface Props {
  prs: PrRecord[];
  limit?: number;
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

const STATE_STYLE: Record<string, string> = {
  merged: 'bg-purple-100 text-purple-700',
  open: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

export function LatestPrs({ prs, limit = 20 }: Props) {
  const items = prs.slice(0, limit);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Latest contributions</h2>
      <p className="text-sm text-gray-500 mb-4">Newest pull requests opened to OSS projects</p>
      <ul className="divide-y divide-gray-100">
        {items.map((pr) => (
          <li key={pr.url} className="py-3 flex items-start gap-3">
            <span
              className={`shrink-0 mt-0.5 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                STATE_STYLE[pr.state] ?? STATE_STYLE.closed
              }`}
            >
              {pr.state}
            </span>
            <div className="flex-1 min-w-0">
              <a
                href={pr.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-gray-900 hover:text-brand line-clamp-2"
              >
                {pr.title}
              </a>
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="font-mono">{pr.repo}</span>
                <span>·</span>
                <a
                  href={`https://github.com/${pr.author}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand"
                >
                  @{pr.author}
                </a>
                <span>·</span>
                <span>{timeAgo(pr.createdAt)}</span>
              </div>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="py-3 text-sm text-gray-400">No PRs to show.</li>}
      </ul>
    </div>
  );
}
