interface Props {
  pct: number;
}

export function GrowthBadge({ pct }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-growth bg-green-50 shadow-[0_0_8px_rgba(34,197,94,0.4)] border border-green-100"
    >
      ↑ {pct.toFixed(1)}%
    </span>
  );
}
