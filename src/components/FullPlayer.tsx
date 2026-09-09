import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../constants/theme';
import { useAudio } from '../context/AudioContext';
import { useSettings } from '../context/SettingsContext';
import { toggleFavorite } from '../services/storageService';

const { width } = Dimensions.get('window');
const ARTWORK_SIZE = width - 48;

interface FullPlayerProps {
  visible: boolean;
  onClose: () => void;
}

export function FullPlayer({ visible, onClose }: FullPlayerProps) {
  const insets = useSafeAreaInsets();
  const { gradientColors } = useSettings();
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    skipNext,
    skipPrevious,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    seekTo,
  } = useAudio();

  const [isFavorite, setIsFavorite] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [slidePosition, setSlidePosition] = useState(0);

  const scaleAnim = useRef(new Animated.Value(isPlaying ? 1 : 0.92)).current;

  useEffect(() => {
    if (currentTrack) {
      setIsFavorite(currentTrack.isFavorite || false);
    }
  }, [currentTrack]);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isPlaying ? 1 : 0.92,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [isPlaying, scaleAnim]);

  if (!currentTrack) return null;

  const handleToggleFavorite = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newStatus = await toggleFavorite(currentTrack.id);
    setIsFavorite(newStatus);
  };

  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    togglePlayPause();
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    skipNext();
  };

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    skipPrevious();
  };

  const handleShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleShuffle();
  };

  const handleRepeat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleRepeat();
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayPos = isSliding ? slidePosition : position;
  const remaining = duration - displayPos;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <LinearGradient
        colors={gradientColors}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.dragIndicator} />
          <Pressable onPress={onClose} style={styles.closeButton} hitSlop={15}>
            <Ionicons name="chevron-down" size={30} color={THEME.colors.textPrimary} />
          </Pressable>
        </View>

        {/* Artwork */}
        <View style={styles.artworkContainer}>
          <Animated.View style={[styles.artworkWrapper, { transform: [{ scale: scaleAnim }] }]}>
            {currentTrack.artworkUri ? (
              <Animated.Image
                source={{ uri: currentTrack.artworkUri }}
                style={styles.artwork}
              />
            ) : (
              <View style={[styles.artwork, styles.placeholderArtwork]}>
                <Ionicons name="musical-notes" size={72} color={THEME.colors.textTertiary} />
              </View>
            )}
          </Animated.View>
        </View>

        {/* Track Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Scrubber */}
        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={displayPos}
            minimumTrackTintColor={THEME.colors.textPrimary}
            maximumTrackTintColor="rgba(255,255,255,0.14)"
            thumbTintColor={THEME.colors.textPrimary}
            onSlidingStart={() => setIsSliding(true)}
            onValueChange={(val) => setSlidePosition(val)}
            onSlidingComplete={(val) => {
              seekTo(val);
              setIsSliding(false);
            }}
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(displayPos)}</Text>
            <Text style={styles.timeText}>-{formatTime(remaining > 0 ? remaining : 0)}</Text>
          </View>
        </View>

        {/* Main Controls */}
        <View style={styles.mainControls}>
          <Pressable onPress={handleShuffle} hitSlop={15} style={[styles.controlPill, isShuffle && styles.controlPillActive]}>
            <Ionicons
              name="shuffle"
              size={22}
              color={isShuffle ? THEME.colors.textPrimary : THEME.colors.textTertiary}
            />
          </Pressable>

          <Pressable onPress={handlePrev} hitSlop={15} style={styles.iconButton}>
            <Ionicons name="play-skip-back" size={28} color={THEME.colors.textPrimary} />
          </Pressable>

          <Pressable onPress={handlePlayPause} style={styles.playPauseButton}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={30}
              color="#000000"
              style={{ marginLeft: isPlaying ? 0 : 3 }}
            />
          </Pressable>

          <Pressable onPress={handleNext} hitSlop={15} style={styles.iconButton}>
            <Ionicons name="play-skip-forward" size={28} color={THEME.colors.textPrimary} />
          </Pressable>

          <Pressable onPress={handleRepeat} hitSlop={15} style={[styles.controlPill, repeatMode !== 'off' && styles.controlPillActive]}>
            <Ionicons
              name="repeat"
              size={22}
              color={repeatMode !== 'off' ? THEME.colors.textPrimary : THEME.colors.textTertiary}
            />
            {repeatMode === 'one' && (
              <View style={styles.repeatOneBadge}>
                <Text style={styles.repeatOneText}>1</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <Pressable onPress={handleToggleFavorite} hitSlop={15} style={styles.bottomButton}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#FFFFFF' : THEME.colors.textSecondary}
            />
          </Pressable>
          <Pressable hitSlop={15} style={styles.bottomButton}>
            <Ionicons name="list" size={24} color={THEME.colors.textSecondary} />
          </Pressable>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  dragIndicator: {
    width: 36,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2.5,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  closeButton: {
    position: 'absolute',
    top: THEME.spacing.md,
    left: THEME.spacing.lg,
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: THEME.spacing.md,
  },
  artworkWrapper: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: THEME.radii.md,
  },
  placeholderArtwork: {
    backgroundColor: THEME.colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.xl,
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: THEME.spacing.xs,
  },
  artist: {
    color: THEME.colors.textSecondary,
    fontSize: 16,
  },
  progressContainer: {
    marginTop: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.xl,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.xs,
    marginTop: -8,
  },
  timeText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.xl,
  },
  controlPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  repeatOneBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatOneText: {
    color: '#000000',
    fontSize: 8,
    fontWeight: 'bold',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    marginBottom: 40,
    paddingHorizontal: THEME.spacing.xl * 1.5,
  },
  bottomButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
