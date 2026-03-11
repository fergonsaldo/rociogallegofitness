/**
 * YouTube URL utilities.
 *
 * Supports the following URL formats:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://youtube.com/watch?v=VIDEO_ID
 *   https://youtu.be/VIDEO_ID
 *   https://www.youtube.com/embed/VIDEO_ID
 *   https://www.youtube.com/shorts/VIDEO_ID
 */

const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

/**
 * Extracts the 11-character YouTube video ID from a URL.
 * Returns null if the URL is not a valid YouTube URL.
 */
export function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

/**
 * Returns true if the URL is a valid YouTube URL with an extractable video ID.
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}
