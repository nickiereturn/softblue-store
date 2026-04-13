export function convertToEmbedUrl(url?: string) {
  if (!url) {
    return "";
  }

  const watchMatch = url.match(/v=([^&]+)/);

  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);

  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  const embedMatch = url.match(/youtube\.com\/embed\/([^?&/]+)/);

  if (embedMatch?.[1]) {
    return `https://www.youtube.com/embed/${embedMatch[1]}`;
  }

  return url;
}
