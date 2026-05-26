import type { PersonStat } from '../types';

interface Props {
  people: PersonStat[];
}

const RANK_BADGE = ['bg-yellow-400 text-yellow-900', 'bg-gray-300 text-gray-700', 'bg-orange-300 text-orange-900'];

export function Leaderboard({ people }: Props) {
  const top = people.slice(0, 15);
  const max = top[0]?.prCount ?? 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Leaderboard</h2>
      <p className="text-sm text-gray-500 mb-4">Top contributors across the OSS ecosystem</p>
      <ol className="space-y-2">
        {top.map((p, i) => (
          <li key={p.login} className="flex items-center gap-3">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                i < 3 ? RANK_BADGE[i] : 'bg-gray-50 text-gray-400'
              }`}
            >
              {i + 1}
            </span>
            <a
              href={`https://github.com/${p.login}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-sm text-gray-800 hover:text-brand min-w-[10rem]"
            >
              {p.login}
            </a>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full"
                style={{ width: `${(p.prCount / max) * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 w-12 text-right">{p.prCount}</span>
            <span className="text-xs text-gray-400 w-16 text-right">{p.reposCount} repos</span>
          </li>
        ))}
        {top.length === 0 && <li className="text-sm text-gray-400">No data yet — run the fetch script.</li>}
      </ol>
    </div>
  );
}
