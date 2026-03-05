interface Props {
  className?: string;
}

export function LoadingSkeleton({ className = '' }: Props) {
  return <div className={`bg-gray-200 animate-pulse ${className}`} />;
}
