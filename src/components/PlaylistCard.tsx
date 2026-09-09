import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../constants/theme';
import { Playlist, Track } from '../types/music';

interface PlaylistCardProps {
  playlist: Playlist;
  tracks: Track[];
  onPress: () => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  tracks,
  onPress,
}) => {
  const artworkTracks = tracks.filter(t => t.artwork || t.artworkUri).slice(0, 4);

  const getArtwork = (t: Track) => (t.artwork || t.artworkUri || '');

  const renderMosaic = () => {
    if (artworkTracks.length === 0) {
      return (
        <LinearGradient
          colors={THEME.colors.toneGradient}
          style={styles.mosaicContainer}
        />
      );
    }
    if (artworkTracks.length < 4) {
      return (
        <Image 
          source={{ uri: getArtwork(artworkTracks[0]) }} 
          style={styles.mosaicContainer}
        />
      );
    }
    
    return (
      <View style={styles.mosaicContainer}>
        <View style={styles.mosaicRow}>
          <Image source={{ uri: getArtwork(artworkTracks[0]) }} style={styles.mosaicItem} />
          <Image source={{ uri: getArtwork(artworkTracks[1]) }} style={styles.mosaicItem} />
        </View>
        <View style={styles.mosaicRow}>
          <Image source={{ uri: getArtwork(artworkTracks[2]) }} style={styles.mosaicItem} />
          <Image source={{ uri: getArtwork(artworkTracks[3]) }} style={styles.mosaicItem} />
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageWrapper}>
        {renderMosaic()}
      </View>
      <Text style={styles.title} numberOfLines={1}>{playlist.title || playlist.name}</Text>
      <Text style={styles.count} numberOfLines={1}>
        {playlist.trackIds.length} {playlist.trackIds.length === 1 ? 'track' : 'tracks'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    marginRight: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  imageWrapper: {
    width: 160,
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: THEME.spacing.sm,
  },
  mosaicContainer: {
    width: '100%',
    height: '100%',
  },
  mosaicRow: {
    flex: 1,
    flexDirection: 'row',
  },
  mosaicItem: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  count: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
  },
});
