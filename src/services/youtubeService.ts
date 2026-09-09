import { YouTubeSearchResult, Track } from '../types/music';
import { saveAudioFile, saveArtworkFile } from './fileManager';
import { saveTrack } from './storageService';

/**
 * Detects if input is a YouTube URL and extracts the 11-character video ID
 */
export function extractYouTubeId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Searches YouTube directly via Innertube API for high reliability and speed
 */
export async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
  if (!query || !query.trim()) return [];

  const videoId = extractYouTubeId(query.trim());
  if (videoId) {
    const directResult: YouTubeSearchResult = {
      id: videoId,
      title: 'Vidéo YouTube',
      artist: 'YouTube',
      duration: 0,
      durationFormatted: 'Audio',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      channelTitle: 'YouTube',
    };
    return [directResult];
  }

  try {
    const response = await fetch('https://www.youtube.com/youtubei/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20231201.00.00',
          },
        },
        query: query.trim(),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const sections =
        data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
          ?.contents || [];

      const results: YouTubeSearchResult[] = [];

      for (const section of sections) {
        const items = section.itemSectionRenderer?.contents || [];
        for (const item of items) {
          if (item.videoRenderer) {
            const v = item.videoRenderer;
            const id = v.videoId;
            if (!id) continue;

            const title = v.title?.runs?.[0]?.text || 'Titre inconnu';
            const artist = v.ownerText?.runs?.[0]?.text || 'Artiste inconnu';
            const durationFormatted = v.lengthText?.simpleText || '3:30';

            const thumbs = v.thumbnail?.thumbnails || [];
            const thumbnail =
              thumbs.length > 0
                ? thumbs[thumbs.length - 1].url
                : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

            results.push({
              id,
              title,
              artist,
              duration: parseDurationToSeconds(durationFormatted),
              durationFormatted,
              thumbnail,
              thumbnailUrl: thumbnail,
              channelTitle: artist,
            });
          }
        }
      }

      if (results.length > 0) {
        return results.slice(0, 25);
      }
    }
  } catch (error) {
    console.warn('Primary Innertube search failed, trying fallback:', error);
  }

  // Fallback: Invidious public instance
  try {
    const fallbackRes = await fetch(
      `https://invidious.projectsegfau.lt/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
      { headers: { Accept: 'application/json' } }
    );
    if (fallbackRes.ok) {
      const items = await fallbackRes.json();
      return (items || []).slice(0, 20).map((item: any) => ({
        id: item.videoId,
        title: item.title || 'Inconnu',
        artist: item.author || 'Artiste',
        duration: item.lengthSeconds || 0,
        durationFormatted: formatDuration(item.lengthSeconds || 0),
        thumbnail:
          item.videoThumbnails?.[0]?.url ||
          `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
        thumbnailUrl:
          item.videoThumbnails?.[0]?.url ||
          `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
        channelTitle: item.author || '',
      }));
    }
  } catch {}

  return [];
}

/**
 * Gets the direct downloadable MP3 audio stream URL for a YouTube video
 */
export async function getAudioStreamUrl(
  videoId: string,
  onProgress?: (progress: number) => void
): Promise<string | null> {
  try {
    const initRes = await fetch(
      `https://loader.to/ajax/download.php?format=mp3&url=https://www.youtube.com/watch?v=${videoId}`,
      { headers: { Accept: 'application/json' } }
    );

    if (initRes.ok) {
      const initData = await initRes.json();
      if (initData.download_url && initData.download_url.startsWith('http')) {
        return initData.download_url;
      }

      const progressUrl = initData.progress_url;
      if (progressUrl) {
        // Poll for completion (up to 40 attempts * 1000ms = 40 seconds, accommodates long songs)
        for (let i = 0; i < 40; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          try {
            const progRes = await fetch(progressUrl);
            if (progRes.ok) {
              const progData = await progRes.json();
              if (progData.progress) {
                const ratio = Math.min(progData.progress / 1000, 0.95);
                onProgress?.(ratio);
              }
              if (progData.download_url && progData.download_url.startsWith('http')) {
                onProgress?.(1.0);
                return progData.download_url;
              }
              if (progData.success === 1 && progData.download_url) {
                onProgress?.(1.0);
                return progData.download_url;
              }
            }
          } catch {}
        }
      }
    }
  } catch (error) {
    console.error('Error resolving audio stream:', error);
  }

  return null;
}

/**
 * Downloads a YouTube video as an MP3 audio file and saves it locally for 100% offline playback
 */
export async function downloadYouTubeAudio(
  videoId: string,
  metadata: YouTubeSearchResult,
  onProgress?: (progress: number) => void
): Promise<Track | null> {
  try {
    const downloadUrl = await getAudioStreamUrl(videoId, onProgress);
    if (!downloadUrl) {
      throw new Error("Impossible d'extraire le flux audio pour cette vidéo");
    }

    const cleanTitle = metadata.title.replace(/[^a-zA-Z0-9 ._-]/g, '').substring(0, 60);

    // Download audio file to sandboxed document storage
    const audioUri = await saveAudioFile(downloadUrl, `${cleanTitle}.mp3`, onProgress);

    // Download high-resolution cover artwork
    let artworkUri: string | undefined;
    const thumbUrl = metadata.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    if (thumbUrl) {
      artworkUri = await saveArtworkFile(thumbUrl, cleanTitle);
    }

    const track: Track = {
      id: `yt_${videoId}_${Date.now()}`,
      title: metadata.title,
      artist: metadata.artist,
      duration: metadata.duration || 0,
      uri: audioUri,
      artworkUri,
      artwork: artworkUri,
      source: 'youtube',
      youtubeId: videoId,
      addedAt: Date.now(),
      isFavorite: false,
      isDownloaded: true,
    };

    await saveTrack(track);
    return track;
  } catch (error) {
    console.error('Failed to download YouTube audio:', error);
    return null;
  }
}

/**
 * Batch download multiple selected YouTube videos
 */
export async function batchDownload(
  items: YouTubeSearchResult[],
  onItemProgress?: (index: number, progress: number) => void,
  onItemComplete?: (index: number, track: Track | null) => void
): Promise<Track[]> {
  const downloadedTracks: Track[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const track = await downloadYouTubeAudio(
      item.id,
      item,
      (progress) => onItemProgress?.(i, progress)
    );
    onItemComplete?.(i, track);
    if (track) {
      downloadedTracks.push(track);
    }
  }

  return downloadedTracks;
}

// ──────────────────────────── HELPERS ────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseDurationToSeconds(durationStr: string): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}
