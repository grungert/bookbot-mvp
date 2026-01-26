export function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000)
    return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  if (tokens >= 1_000)
    return `${(tokens / 1_000).toFixed(tokens % 1_000 === 0 ? 0 : 1)}K`;
  return tokens.toLocaleString();
}
