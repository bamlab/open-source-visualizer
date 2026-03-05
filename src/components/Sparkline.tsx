import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import type { MonthlyDownload } from '../types';

interface Props {
  data: MonthlyDownload[];
  isGrowing: boolean;
}

export function Sparkline({ data, isGrowing }: Props) {
  const color = isGrowing ? '#22C55E' : '#E63946';
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data}>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const val = payload[0].value as number;
            return (
              <div className="bg-white border border-gray-100 rounded px-2 py-1 text-xs shadow">
                {val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val}
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="downloads"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
