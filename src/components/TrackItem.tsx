import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { Track } from '../types/music';

interface TrackItemProps {
  track: Track;
  isPlaying?: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  onOptions: () => void;
}

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '3:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const TrackItem: React.FC<TrackItemProps> = ({
  track,
  isPlaying = false,
  onPress,
  onToggleFavorite,
  onOptions,
}) => {
  return (
    <TouchableOpacity 
      style={[styles.container, isPlaying && styles.playingContainer]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isPlaying && <View style={styles.playingIndicator} />}
      
      <View style={styles.artworkContainer}>
        {(track.artworkUri || track.artwork) ? (
          <Image source={{ uri: track.artworkUri || track.artwork }} style={styles.artwork} />
        ) : (
          <View style={styles.placeholderArtwork}>
            <Ionicons name="musical-notes" size={22} color={THEME.colors.textTertiary} />
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.title, isPlaying && styles.playingText]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist || 'Unknown Artist'}
        </Text>
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onToggleFavorite}>
          <Ionicons 
            name={track.isFavorite ? "heart" : "heart-outline"} 
            size={20} 
            color={track.isFavorite ? "#FFFFFF" : THEME.colors.textTertiary} 
          />
        </TouchableOpacity>
        <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
        <TouchableOpacity style={styles.actionButton} onPress={onOptions}>
          <Ionicons name="ellipsis-horizontal" size={20} color={THEME.colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: 'transparent',
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 14,
  },
  playingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  playingIndicator: {
    position: 'absolute',
    left: 4,
    top: 14,
    bottom: 14,
    width: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  artworkContainer: {
    marginRight: 12,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholderArtwork: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  playingText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  artist: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    color: THEME.colors.textTertiary,
    fontSize: 12,
    marginHorizontal: 8,
    minWidth: 38,
    textAlign: 'right',
  },
  actionButton: {
    padding: 6,
  },
});
