/** 842 -> "842", 1234 -> "1.2K", 3_200_000 -> "3.2M" */
export const formatViewers = (n?: number | null): string => {
  const v = Math.max(0, Math.floor(n ?? 0));
  if (v >= 1_000_000) return `${trim(v / 1_000_000)}M`;
  if (v >= 1_000) return `${trim(v / 1_000)}K`;
  return String(v);
};

const trim = (x: number) => (Math.floor(x * 10) / 10).toString();
