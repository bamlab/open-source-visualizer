export async function fetchStars(owner: string, repo: string, token?: string): Promise<number> {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status} for ${owner}/${repo}`);
  }
  const data = await res.json();
  return data.stargazers_count as number;
}
