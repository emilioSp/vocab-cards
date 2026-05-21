export type OpenverseImage = {
  id: string
  title: string
  url: string
  thumbnail: string
}

export async function searchImages(query: string): Promise<OpenverseImage[]> {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=18`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image search failed (${res.status})`);
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

export async function downloadImageAsBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    // CORS/network blocked — return the URL as fallback
    return url;
  }
}
