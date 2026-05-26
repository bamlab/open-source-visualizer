import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts';
import type { PrRecord } from '../types';

interface Props {
  prs: PrRecord[];
}

export function PrStatusPanel({ prs }: Props) {
  const merged = prs.filter((p) => p.state === 'merged').length;
  const open = prs.filter((p) => p.state === 'open').length;
  const total = merged + open;
  const mergeRate = total > 0 ? Math.round((merged / total) * 100) : 0;

  const byYear = new Map<string, number>();
  for (const pr of prs) {
    const y = pr.createdAt.slice(0, 4);
    byYear.set(y, (byYear.get(y) ?? 0) + 1);
  }
  const chartData = Array.from(byYear.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => ({ year, count }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">PR status</h2>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-purple-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-purple-700">{merged}</div>
          <div className="text-xs text-purple-600 uppercase font-semibold tracking-wide">Merged</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-green-700">{open}</div>
          <div className="text-xs text-green-600 uppercase font-semibold tracking-wide">Open</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-2xl font-bold text-gray-900">{mergeRate}%</div>
          <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Merge rate</div>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-2">By year</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 4, left: 4, bottom: 0 }}>
              <XAxis
                dataKey="year"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
              />
              <YAxis hide />
              <Bar dataKey="count" fill="#E63946" radius={[3, 3, 0, 0]}>
                <LabelList
                  dataKey="count"
                  position="top"
                  style={{ fill: '#6B7280', fontSize: 10 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
