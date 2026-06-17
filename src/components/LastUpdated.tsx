interface LastUpdatedProps {
  generatedAt: string | null;
}

export function LastUpdated({ generatedAt }: LastUpdatedProps) {
  if (!generatedAt) return null;

  const date = new Date(generatedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <span className="absolute top-4 left-4 z-20 text-[11px] text-gray-400 select-none pointer-events-none">
      Updated {date}
    </span>
  );
}
