export async function api(path, options) {
  const response = await fetch(`${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed. Please try again.');
  return body;
}
