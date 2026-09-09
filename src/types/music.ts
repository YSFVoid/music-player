export type TrackSource = 'local_import' | 'youtube' | 'bundled' | 'url';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  uri: string; // local file:/// path or remote URL
  artworkUri?: string;
  artwork?: string; // alias for artworkUri
  artworkUrl?: string; // alias for artworkUri
  source: TrackSource;
  youtubeId?: string;
  addedAt: number;
  isFavorite?: boolean;
  isDownloaded?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  name?: string; // alias for title
  description?: string;
  artworkUri?: string;
  trackIds: string[];
  createdAt: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface AudioPlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number; // in seconds
  duration: number; // in seconds
  isBuffering: boolean;
  queue: Track[];
  queueIndex: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  volume: number;
}

export interface ListeningStats {
  totalSecondsListened: number;
  playCounts: Record<string, number>;
  lastPlayed: Record<string, number>;
}

export interface YouTubeSearchResult {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  durationFormatted: string;
  thumbnail: string;
  thumbnailUrl?: string; // alias for thumbnail
  thumbnails?: any;
  channelTitle: string;
}
