import { Paths, Directory, File } from 'expo-file-system';

export const audioDirectory = new Directory(Paths.document, 'audio');
export const artworkDirectory = new Directory(Paths.document, 'artwork');

/**
 * Ensures the required directories exist in the app's sandboxed storage
 */
export async function initStorageDirectories(): Promise<void> {
  try {
    if (!audioDirectory.exists) {
      audioDirectory.create({ idempotent: true });
    }
    if (!artworkDirectory.exists) {
      artworkDirectory.create({ idempotent: true });
    }
  } catch (error) {
    console.error('Error initializing storage directories:', error);
  }
}

/**
 * Downloads a remote audio file to local storage for 100% offline playback
 */
export async function saveAudioFile(
  remoteUrl: string,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  await initStorageDirectories();
  const cleanName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const destFile = new File(audioDirectory, cleanName);

  const downloaded = await File.downloadFileAsync(remoteUrl, destFile, { idempotent: true });
  return downloaded.uri;
}

/**
 * Saves a local file (e.g. from DocumentPicker) into app storage
 */
export async function copyToAppStorage(sourceUri: string, filename: string): Promise<string> {
  await initStorageDirectories();
  const cleanName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const source = new File(sourceUri);
  const destFile = new File(audioDirectory, cleanName);
  await source.copy(destFile);
  return destFile.uri;
}

/**
 * Downloads an image (e.g. YouTube thumbnail) to local storage for offline viewing
 */
export async function saveArtworkFile(imageUrl: string, filename: string): Promise<string | undefined> {
  try {
    await initStorageDirectories();
    const cleanName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}.jpg`;
    const destFile = new File(artworkDirectory, cleanName);
    const downloaded = await File.downloadFileAsync(imageUrl, destFile, { idempotent: true });
    return downloaded.uri;
  } catch (error) {
    console.warn('Failed to cache artwork locally, falling back to remote url:', error);
    return imageUrl;
  }
}

/**
 * Deletes a local audio file and its artwork if stored locally
 */
export async function deleteLocalFile(fileUri: string): Promise<void> {
  try {
    const file = new File(fileUri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.error('Error deleting local file:', error);
  }
}
