import type { PersonStat, PrRecord } from '../types';
import { useSelectedPerson } from '../store/selectedPerson';

interface Props {
  people: PersonStat[];
  prs: PrRecord[];
}

const RANK_BADGE = ['bg-yellow-400 text-yellow-900', 'bg-gray-300 text-gray-700', 'bg-orange-300 text-orange-900'];

function computeBadges(
  person: PersonStat,
  prs: PrRecord[],
  people: PersonStat[],
): { hot: boolean; top10: boolean; polyglot: boolean } {
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const recentPrCount = prs.filter(
    (pr) => pr.author === person.login && now - new Date(pr.createdAt).getTime() <= ninetyDaysMs,
  ).length;
  const hot = recentPrCount >= 3;

  const showTop10 = people.length >= 5;
  const top10Cutoff = Math.max(1, Math.ceil(people.length * 0.1));
  const rank = people.findIndex((p) => p.login === person.login) + 1;
  const top10 = showTop10 && rank > 0 && rank <= top10Cutoff;

  const polyglot = person.reposCount >= 4;

  return { hot, top10, polyglot };
}

function BadgeIcon({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="relative group inline-flex">
      <span className="text-base leading-none select-none cursor-help" aria-label={label}>
        {emoji}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md bg-gray-900 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
      >
        {label}
      </span>
    </span>
  );
}

export function Leaderboard({ people, prs }: Props) {
  const top = people.slice(0, 15);
  const max = top[0]?.prCount ?? 1;
  const { selectedPerson, toggle } = useSelectedPerson();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Leaderboard</h2>
      <p className="text-sm text-gray-500 mb-4">Top contributors across the OSS ecosystem</p>
      <ol className="space-y-1">
        {top.map((p, i) => {
          const badges = computeBadges(p, prs, people);
          const isSelected = selectedPerson === p.login;
          return (
            <li
              key={p.login}
              className={`grid grid-cols-[2rem_2.5rem_minmax(0,12rem)_4rem_1fr_3rem_4rem] items-center gap-3 px-2 py-1.5 rounded-xl transition-colors ring-2 ${
                isSelected ? 'ring-brand bg-red-50' : 'ring-transparent'
              }`}
            >
              {/* col 1: rank badge */}
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  i < 3 ? RANK_BADGE[i] : 'bg-gray-50 text-gray-400'
                }`}
              >
                {i + 1}
              </span>

              {/* col 2: avatar */}
              <button
                onClick={() => toggle(p.login)}
                aria-label={`Filter contributions by ${p.login}`}
                className="flex-shrink-0 cursor-pointer bg-transparent border-0 p-0"
              >
                <img
                  src={`https://github.com/${p.login}.png?size=64`}
                  alt={p.login}
                  className="w-9 h-9 rounded-full"
                />
              </button>

              {/* col 3: login */}
              <button
                onClick={() => toggle(p.login)}
                aria-label={`Filter contributions by ${p.login}`}
                className="cursor-pointer bg-transparent border-0 p-0 font-mono text-sm text-gray-800 hover:text-brand truncate text-left"
              >
                {p.login}
              </button>

              {/* col 4: emoji badges with hover tooltips */}
              <div className="flex items-center gap-1">
                {badges.hot && <BadgeIcon emoji="🔥" label="Hot: 3+ pull requests in the last 90 days" />}
                {badges.top10 && <BadgeIcon emoji="🏆" label="Top 10%: ranked among the top contributors" />}
                {badges.polyglot && <BadgeIcon emoji="🌟" label="Polyglot: contributed to 4+ repositories" />}
              </div>

              {/* col 5: progress bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full"
                  style={{ width: `${(p.prCount / max) * 100}%` }}
                />
              </div>

              {/* col 6: PR count */}
              <span className="text-sm font-semibold text-gray-900 text-right">{p.prCount}</span>

              {/* col 7: repos count */}
              <span className="text-xs text-gray-400 text-right">{p.reposCount} repos</span>
            </li>
          );
        })}
        {top.length === 0 && <li className="text-sm text-gray-400">No data yet — run the fetch script.</li>}
      </ol>
    </div>
  );
}
