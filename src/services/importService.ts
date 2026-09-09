import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Track } from '../types/music';
import { copyToAppStorage, artworkDirectory } from './fileManager';
import { saveTrack } from './storageService';
import { parseId3 } from '../utils/id3Parser';

/**
 * Opens the iOS Files app / document picker and lets the user
 * select audio files (.mp3, .m4a, .wav, etc.).
 * Automatically extracts embedded ID3 metadata (Title, Artist, Album, and Cover Art).
 */
export async function importAudioFiles(): Promise<Track[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/flac', 'audio/aac'],
    multiple: true,
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return [];
  }

  const importedTracks: Track[] = [];

  for (const asset of result.assets) {
    try {
      const localUri = await copyToAppStorage(asset.uri, asset.name);

      // Default fallback title from filename
      const rawName = asset.name || 'Track';
      const fallbackTitle = rawName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

      let title = fallbackTitle;
      let artist = 'Unknown Artist';
      let album: string | undefined;
      let artworkUri: string | undefined;
      let duration = 0;

      // Extract embedded ID3 tags, cover artwork, and duration
      try {
        const file = new File(localUri);
        const bytes = await file.bytes();
        const id3 = parseId3(bytes);

        if (id3.title && id3.title.trim()) title = id3.title.trim();
        if (id3.artist && id3.artist.trim()) artist = id3.artist.trim();
        if (id3.album && id3.album.trim()) album = id3.album.trim();
        if (id3.duration && id3.duration > 0) duration = id3.duration;

        if (id3.coverBytes && id3.coverBytes.length > 0) {
          const ext = id3.coverMime?.includes('png') ? 'png' : 'jpg';
          const coverFilename = `${Date.now()}_cover.${ext}`;
          const coverFile = new File(artworkDirectory, coverFilename);
          coverFile.create({ overwrite: true, intermediates: true });
          coverFile.write(id3.coverBytes);
          artworkUri = coverFile.uri;
        }
      } catch (parseError) {
        console.warn('Could not extract ID3 tags from file:', parseError);
      }

      const track: Track = {
        id: `import_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        title,
        artist,
        album,
        duration,
        uri: localUri,
        artworkUri,
        artwork: artworkUri,
        source: 'local_import',
        addedAt: Date.now(),
        isFavorite: false,
        isDownloaded: true,
      };

      await saveTrack(track);
      importedTracks.push(track);
    } catch (error) {
      console.error(`Failed to import file ${asset.name}:`, error);
    }
  }

  return importedTracks;
}
