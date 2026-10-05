export async function request(url, options = {}) {
  const response = await fetch(url, { credentials: 'include', ...options });
  if (!response.ok) {
    let detail = `Server returned ${response.status}`;
    try {
      const body = await response.json();
      if (body.error) detail = body.error;
    } catch {
      /* keep status text */
    }
    throw new Error(detail);
  }
  return response.json();
}
