import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { Track, RepeatMode } from '../types/music';
import { recordPlay, updateTrackMeta } from '../services/storageService';
import { shuffleArray } from '../utils/helpers';

// ──────────────────────────── TYPES ────────────────────────────

interface AudioContextType {
  // State
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
  queue: Track[];
  queueIndex: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;

  // Player ref (for useAudioPlayerStatus in components)
  player: AudioPlayer | null;

  // Actions
  playTrack: (track: Track, trackList?: Track[]) => void;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  skipNext: () => void;
  skipPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
  clearQueue: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

// ──────────────────────────── PROVIDER ────────────────────────────

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');

  const playerRef = useRef<AudioPlayer | null>(null);
  const originalQueueRef = useRef<Track[]>([]);
  const playStartTimeRef = useRef<number>(0);
  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize audio mode for background playback
  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        });
        await setIsAudioActiveAsync(true);
      } catch (e) {
        console.warn('Failed to init audio mode:', e);
      }
    })();
  }, []);

  // Status polling for position updates
  useEffect(() => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
    }

    if (playerRef.current) {
      statusIntervalRef.current = setInterval(() => {
        const p = playerRef.current;
        if (!p) return;

        setPosition(p.currentTime || 0);
        if (p.duration && p.duration > 0) {
          setDuration(p.duration);
        }
        setIsPlaying(p.playing);
        setIsLoading(p.isBuffering);
      }, 300);
    }

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [currentTrack, queueIndex, repeatMode, isShuffle, queue]);

  // ─── Track End Handler ───
  const handleTrackEnd = useCallback(() => {
    // Record listening stats
    if (currentTrack) {
      const listenedSeconds = Math.floor(Date.now() / 1000 - playStartTimeRef.current / 1000);
      recordPlay(currentTrack.id, Math.min(listenedSeconds, currentTrack.duration || 300));
    }

    if (repeatMode === 'one') {
      // Replay same track
      playerRef.current?.seekTo(0);
      playerRef.current?.play();
      return;
    }

    // Next track
    if (queueIndex < queue.length - 1) {
      loadTrack(queue[queueIndex + 1], queueIndex + 1);
    } else if (repeatMode === 'all' && queue.length > 0) {
      loadTrack(queue[0], 0);
    } else {
      setIsPlaying(false);
    }
  }, [currentTrack, queueIndex, queue, repeatMode]);

  // ─── Core: Load and play a track ───
  const loadTrack = useCallback(
    async (track: Track, index: number) => {
      // Pause old player - DO NOT call setActiveForLockScreen(false) as it kills the AVAudioSession
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.remove();
        } catch (e) {
          console.warn('Error pausing old player:', e);
        }
        playerRef.current = null;
      }

      setCurrentTrack(track);
      setQueueIndex(index);
      setIsLoading(true);
      setPosition(0);
      setDuration(track.duration || 0);
      playStartTimeRef.current = Date.now();

      try {
        const newPlayer = createAudioPlayer(track.uri, {
          keepAudioSessionActive: true,
        });
        playerRef.current = newPlayer;

        // Set lock screen metadata with isLiveStream: false so the scrubber bar appears
        newPlayer.setActiveForLockScreen(
          true,
          {
            title: track.title,
            artist: track.artist,
            albumTitle: track.album || 'Music Player',
            artworkUrl: track.artworkUri || track.artwork || undefined,
          },
          {
            isLiveStream: false,
            showSeekForward: false,
            showSeekBackward: false,
          }
        );

        // Set up event listener for playback status updates
        newPlayer.addListener('playbackStatusUpdate', (status) => {
          if (status.isLoaded) {
            setIsLoading(false);
            const loadedDur = newPlayer.duration || track.duration || 0;
            setDuration(loadedDur);

            // Persist duration to storage if it was previously missing (e.g. from local import)
            if ((!track.duration || track.duration === 0) && loadedDur > 0) {
              track.duration = loadedDur;
              updateTrackMeta(track.id, { duration: loadedDur });
            }

            // Re-apply metadata with resolved duration so lock screen displays full timeline
            newPlayer.updateLockScreenMetadata({
              title: track.title,
              artist: track.artist,
              albumTitle: track.album || 'Music Player',
              artworkUrl: track.artworkUri || track.artwork || undefined,
            });
          }

          // Handle track completion natively
          if (status.didJustFinish) {
            handleTrackEnd();
          }
        });

        // Start playback
        newPlayer.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error loading track:', error);
        setIsLoading(false);
      }
    },
    []
  );

  // ─── Public Actions ───

  const playTrack = useCallback(
    (track: Track, trackList?: Track[]) => {
      const newQueue = trackList || [track];
      const index = newQueue.findIndex((t) => t.id === track.id);
      originalQueueRef.current = newQueue;

      if (isShuffle) {
        const shuffled = shuffleArray(newQueue);
        // Move selected track to front
        const selectedIdx = shuffled.findIndex((t) => t.id === track.id);
        if (selectedIdx > 0) {
          [shuffled[0], shuffled[selectedIdx]] = [shuffled[selectedIdx], shuffled[0]];
        }
        setQueue(shuffled);
        loadTrack(track, 0);
      } else {
        setQueue(newQueue);
        loadTrack(track, index >= 0 ? index : 0);
      }
    },
    [isShuffle, loadTrack]
  );

  const playQueue = useCallback(
    (tracks: Track[], startIndex = 0) => {
      if (tracks.length === 0) return;
      originalQueueRef.current = tracks;

      if (isShuffle) {
        const shuffled = shuffleArray(tracks);
        setQueue(shuffled);
        loadTrack(shuffled[0], 0);
      } else {
        setQueue(tracks);
        loadTrack(tracks[startIndex] || tracks[0], startIndex);
      }
    },
    [isShuffle, loadTrack]
  );

  const togglePlayPause = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.playing) {
      p.pause();
      setIsPlaying(false);
    } else {
      p.play();
      setIsPlaying(true);
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
    setPosition(seconds);
  }, []);

  const skipNext = useCallback(() => {
    if (queue.length === 0) return;
    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      loadTrack(queue[nextIndex], nextIndex);
    } else if (repeatMode === 'all') {
      loadTrack(queue[0], 0);
    }
  }, [queue, queueIndex, repeatMode, loadTrack]);

  const skipPrevious = useCallback(() => {
    if (queue.length === 0) return;
    // If we're more than 3 seconds in, restart the track
    if (position > 3) {
      playerRef.current?.seekTo(0);
      setPosition(0);
      return;
    }
    const prevIndex = queueIndex - 1;
    if (prevIndex >= 0) {
      loadTrack(queue[prevIndex], prevIndex);
    } else if (repeatMode === 'all') {
      loadTrack(queue[queue.length - 1], queue.length - 1);
    }
  }, [queue, queueIndex, position, repeatMode, loadTrack]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      if (!prev) {
        // Turning shuffle ON: shuffle the remaining queue
        const remaining = queue.slice(queueIndex + 1);
        const shuffled = shuffleArray(remaining);
        setQueue([...queue.slice(0, queueIndex + 1), ...shuffled]);
      } else {
        // Turning shuffle OFF: restore original queue order
        const current = queue[queueIndex];
        const originalIndex = originalQueueRef.current.findIndex((t) => t.id === current?.id);
        setQueue(originalQueueRef.current);
        if (originalIndex >= 0) setQueueIndex(originalIndex);
      }
      return !prev;
    });
  }, [queue, queueIndex]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const addToQueue = useCallback(
    (track: Track) => {
      setQueue((prev) => [...prev, track]);
      originalQueueRef.current = [...originalQueueRef.current, track];
    },
    []
  );

  const clearQueue = useCallback(() => {
    setQueue([]);
    setQueueIndex(-1);
    originalQueueRef.current = [];
  }, []);

  const value: AudioContextType = {
    currentTrack,
    isPlaying,
    isLoading,
    position,
    duration,
    queue,
    queueIndex,
    isShuffle,
    repeatMode,
    player: playerRef.current,
    playTrack,
    playQueue,
    togglePlayPause,
    seekTo,
    skipNext,
    skipPrevious,
    toggleShuffle,
    toggleRepeat,
    addToQueue,
    clearQueue,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

// ──────────────────────────── HOOK ────────────────────────────

export function useAudio(): AudioContextType {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
