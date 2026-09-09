import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, Playlist, ListeningStats } from '../types/music';

const TRACKS_KEY = '@tracks';
const PLAYLISTS_KEY = '@playlists';
const STATS_KEY = '@listening_stats';

// ──────────────────────────── TRACKS ────────────────────────────

const DEMO_TRACKS: Track[] = [
  {
    id: 'demo_1',
    title: 'Midnight Dreams (Lo-Fi)',
    artist: 'Chill Beats',
    album: 'Lofi Chill Vibes',
    duration: 180,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    artworkUri: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&q=80',
    source: 'bundled',
    addedAt: Date.now() - 3600000,
    isFavorite: true,
  },
  {
    id: 'demo_2',
    title: 'Summer Breeze',
    artist: 'Acoustic Soul',
    album: 'Sunlight Memories',
    duration: 215,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    artworkUri: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
    source: 'bundled',
    addedAt: Date.now() - 7200000,
    isFavorite: false,
  },
  {
    id: 'demo_3',
    title: 'Neon Skyline',
    artist: 'Synthwave Groove',
    album: 'Retro Wave Vol. 1',
    duration: 240,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    artworkUri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
    source: 'bundled',
    addedAt: Date.now() - 10800000,
    isFavorite: true,
  },
];

export async function getAllTracks(): Promise<Track[]> {
  try {
    const data = await AsyncStorage.getItem(TRACKS_KEY);
    if (!data) {
      // Seed initial demo tracks so the user can test the app immediately
      await AsyncStorage.setItem(TRACKS_KEY, JSON.stringify(DEMO_TRACKS));
      return DEMO_TRACKS;
    }
    const parsed: Track[] = JSON.parse(data);
    if (!parsed || parsed.length === 0) return DEMO_TRACKS;
    return parsed.map((t) => ({
      ...t,
      duration: t.duration && t.duration > 0 ? t.duration : 195,
    }));
  } catch {
    return DEMO_TRACKS;
  }
}

export async function saveTrack(track: Track): Promise<void> {
  const tracks = await getAllTracks();
  const existingIndex = tracks.findIndex((t) => t.id === track.id);
  if (existingIndex >= 0) {
    tracks[existingIndex] = track;
  } else {
    tracks.unshift(track);
  }
  await AsyncStorage.setItem(TRACKS_KEY, JSON.stringify(tracks));
}

export async function saveTracks(newTracks: Track[]): Promise<void> {
  const tracks = await getAllTracks();
  for (const track of newTracks) {
    const existingIndex = tracks.findIndex((t) => t.id === track.id);
    if (existingIndex >= 0) {
      tracks[existingIndex] = track;
    } else {
      tracks.unshift(track);
    }
  }
  await AsyncStorage.setItem(TRACKS_KEY, JSON.stringify(tracks));
}

export async function deleteTrack(trackId: string): Promise<void> {
  const tracks = await getAllTracks();
  const filtered = tracks.filter((t) => t.id !== trackId);
  await AsyncStorage.setItem(TRACKS_KEY, JSON.stringify(filtered));

  // Also remove from all playlists
  const playlists = await getAllPlaylists();
  for (const pl of playlists) {
    pl.trackIds = pl.trackIds.filter((id) => id !== trackId);
  }
  await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

export async function toggleFavorite(trackId: string): Promise<boolean> {
  const tracks = await getAllTracks();
  const track = tracks.find((t) => t.id === trackId);
  if (!track) return false;
  track.isFavorite = !track.isFavorite;
  await AsyncStorage.setItem(TRACKS_KEY, JSON.stringify(tracks));
  return track.isFavorite;
}

export async function updateTrackMeta(
  trackId: string,
  updates: Partial<Pick<Track, 'title' | 'artist' | 'album' | 'artworkUri' | 'duration'>>
): Promise<void> {
  const tracks = await getAllTracks();
  const track = tracks.find((t) => t.id === trackId);
  if (!track) return;
  Object.assign(track, updates);
  await AsyncStorage.setItem(TRACKS_KEY, JSON.stringify(tracks));
}

export async function getFavorites(): Promise<Track[]> {
  const tracks = await getAllTracks();
  return tracks.filter((t) => t.isFavorite);
}

export async function getRecentTracks(limit = 10): Promise<Track[]> {
  const stats = await getListeningStats();
  const tracks = await getAllTracks();
  const sorted = tracks
    .filter((t) => stats.lastPlayed[t.id])
    .sort((a, b) => (stats.lastPlayed[b.id] || 0) - (stats.lastPlayed[a.id] || 0));
  return sorted.slice(0, limit);
}

// ──────────────────────────── PLAYLISTS ────────────────────────────

export async function getAllPlaylists(): Promise<Playlist[]> {
  try {
    const data = await AsyncStorage.getItem(PLAYLISTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const playlists = await getAllPlaylists();
  const existingIndex = playlists.findIndex((p) => p.id === playlist.id);
  if (existingIndex >= 0) {
    playlists[existingIndex] = playlist;
  } else {
    playlists.unshift(playlist);
  }
  await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  const playlists = await getAllPlaylists();
  const filtered = playlists.filter((p) => p.id !== playlistId);
  await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(filtered));
}

export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  const playlists = await getAllPlaylists();
  const playlist = playlists.find((p) => p.id === playlistId);
  if (!playlist) return;
  if (!playlist.trackIds.includes(trackId)) {
    playlist.trackIds.push(trackId);
  }
  await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  const playlists = await getAllPlaylists();
  const playlist = playlists.find((p) => p.id === playlistId);
  if (!playlist) return;
  playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
  await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

// ──────────────────────────── LISTENING STATS ────────────────────────────

export async function getListeningStats(): Promise<ListeningStats> {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    return data
      ? JSON.parse(data)
      : { totalSecondsListened: 0, playCounts: {}, lastPlayed: {} };
  } catch {
    return { totalSecondsListened: 0, playCounts: {}, lastPlayed: {} };
  }
}

export async function recordPlay(trackId: string, durationSeconds: number): Promise<void> {
  const stats = await getListeningStats();
  stats.totalSecondsListened += durationSeconds;
  stats.playCounts[trackId] = (stats.playCounts[trackId] || 0) + 1;
  stats.lastPlayed[trackId] = Date.now();
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export async function getTopTracks(limit = 5): Promise<{ trackId: string; playCount: number }[]> {
  const stats = await getListeningStats();
  return Object.entries(stats.playCounts)
    .map(([trackId, playCount]) => ({ trackId, playCount }))
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, limit);
}

// ──────────────────────────── USER SETTINGS ────────────────────────────

export interface UserSettings {
  name: string;
  pfpUri: string | null;
  gradientId: string;
  language: 'en' | 'fr' | 'ar';
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  name: 'Ysf',
  pfpUri: null,
  gradientId: 'obsidian',
  language: 'en',
};

const SETTINGS_KEY = '@user_settings';

export async function getUserSettings(): Promise<UserSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_USER_SETTINGS;
    return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_USER_SETTINGS;
  }
}

export async function saveUserSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getUserSettings();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}
