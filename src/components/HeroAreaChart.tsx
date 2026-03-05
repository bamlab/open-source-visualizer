import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { MonthlyDownload } from '../types';

interface Props {
  data: MonthlyDownload[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const formatted = val >= 1000 ? `${(val / 1000).toFixed(0)}K` : String(val);
  return (
    <div className="bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{formatted} downloads</p>
    </div>
  );
}

export function HeroAreaChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E63946" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#E63946" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickFormatter={(val: string) => {
            const [year, month] = val.split('-');
            const d = new Date(Number(year), Number(month) - 1);
            return d.toLocaleString('default', { month: 'short', year: '2-digit' });
          }}
          interval="preserveStartEnd"
        />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="downloads"
          stroke="#E63946"
          strokeWidth={2.5}
          fill="url(#heroGradient)"
          dot={false}
          activeDot={{ r: 5, fill: '#E63946', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
