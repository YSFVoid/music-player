import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { YouTubeSearchResult } from '../types/music';

interface Props {
  item: YouTubeSearchResult;
  onPreview: () => void;
  onDownload: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  isDownloading?: boolean;
  downloadProgress?: number;
}

export const SearchResultItem: React.FC<Props> = ({
  item,
  onPreview,
  onDownload,
  isSelectable = false,
  isSelected = false,
  onToggleSelect,
  isDownloading = false,
  downloadProgress = 0,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelectable && isSelected && styles.selectedContainer
      ]}
      onPress={isSelectable ? onToggleSelect : onPreview}
      onLongPress={!isSelectable && onToggleSelect ? onToggleSelect : undefined}
      activeOpacity={0.7}
    >
      {isSelectable && (
        <View style={styles.checkboxContainer}>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={14} color="#000000" />}
          </View>
        </View>
      )}

      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: item.thumbnail || item.thumbnailUrl || 'https://via.placeholder.com/70' }} style={styles.thumbnail} />
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{item.durationFormatted || item.duration}</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {item.channelTitle || item.artist}
        </Text>
      </View>

      {!isSelectable && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={onPreview}>
            <Ionicons name="play-circle" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onDownload} disabled={isDownloading}>
            {isDownloading ? (
              <View style={styles.downloadingContainer}>
                <Ionicons name="cloud-download" size={24} color="#FFFFFF" />
                <Text style={styles.progressText}>{Math.round(downloadProgress * 100)}%</Text>
              </View>
            ) : (
              <Ionicons name="cloud-download-outline" size={26} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {isDownloading && (
        <View style={[styles.progressBar, { width: `${downloadProgress * 100}%` }]} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginHorizontal: THEME.spacing.md,
    marginVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  selectedContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  checkboxContainer: {
    paddingRight: THEME.spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  thumbnailContainer: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  artist: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 6,
    marginLeft: 4,
  },
  downloadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: '#FFFFFF',
  },
});
