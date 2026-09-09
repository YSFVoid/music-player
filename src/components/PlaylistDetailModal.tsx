import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { THEME } from '../constants/theme';
import { Playlist, Track } from '../types/music';
import { useAudio } from '../context/AudioContext';
import { useSettings } from '../context/SettingsContext';
import { MiniPlayer } from './MiniPlayer';
import { FullPlayer } from './FullPlayer';
import {
  removeTrackFromPlaylist,
  addTrackToPlaylist,
  deletePlaylist,
  savePlaylist,
} from '../services/storageService';
import { formatTime } from '../utils/helpers';

interface PlaylistDetailModalProps {
  visible: boolean;
  playlist: Playlist | null;
  allTracks: Track[];
  onClose: () => void;
  onPlaylistUpdated: () => void;
}

export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({
  visible,
  playlist,
  allTracks,
  onClose,
  onPlaylistUpdated,
}) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 54);

  const { playTrack, playQueue, currentTrack } = useAudio();
  const { gradientColors, t, openSettings } = useSettings();
  const [addSongsModalVisible, setAddSongsModalVisible] = useState(false);
  const [selectedTrackIdsToAdd, setSelectedTrackIdsToAdd] = useState<Set<string>>(new Set());
  const [fullPlayerVisible, setFullPlayerVisible] = useState(false);

  const playlistTracks = useMemo(() => {
    if (!playlist) return [];
    return playlist.trackIds
      .map((id) => allTracks.find((t) => t.id === id))
      .filter((t): t is Track => t !== undefined);
  }, [playlist, allTracks]);

  const availableTracksToAdd = useMemo(() => {
    if (!playlist) return [];
    const currentSet = new Set(playlist.trackIds);
    return allTracks.filter((t) => !currentSet.has(t.id));
  }, [playlist, allTracks]);

  if (!playlist) return null;

  const totalDuration = playlistTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  const handlePlayAll = () => {
    if (playlistTracks.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playQueue(playlistTracks, 0);
  };

  const handleShuffle = () => {
    if (playlistTracks.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const shuffled = [...playlistTracks].sort(() => Math.random() - 0.5);
    playQueue(shuffled, 0);
  };

  const handleRemoveTrack = async (trackId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await removeTrackFromPlaylist(playlist.id, trackId);
    playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
    onPlaylistUpdated();
  };

  const handleDeletePlaylist = () => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.title || playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await deletePlaylist(playlist.id);
            onPlaylistUpdated();
            onClose();
          },
        },
      ]
    );
  };

  const toggleSelectTrackToAdd = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTrackIdsToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirmAddSongs = async () => {
    if (selectedTrackIdsToAdd.size === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    for (const trackId of selectedTrackIdsToAdd) {
      if (!playlist.trackIds.includes(trackId)) {
        playlist.trackIds.push(trackId);
      }
    }
    await savePlaylist(playlist);
    setSelectedTrackIdsToAdd(new Set());
    setAddSongsModalVisible(false);
    onPlaylistUpdated();
  };

  // Mosaic artwork
  const artworkTracks = playlistTracks.filter((t) => t.artwork || t.artworkUri).slice(0, 4);
  const getArtwork = (t: Track) => t.artwork || t.artworkUri || '';

  const renderMosaic = () => {
    if (artworkTracks.length === 0) {
      return (
        <LinearGradient
          colors={gradientColors}
          style={styles.mosaicFull}
        >
          <Ionicons name="musical-notes" size={64} color={THEME.colors.textTertiary} />
        </LinearGradient>
      );
    }
    if (artworkTracks.length < 4) {
      return <Image source={{ uri: getArtwork(artworkTracks[0]) }} style={styles.mosaicFull} />;
    }
    return (
      <View style={styles.mosaicFull}>
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Navigation Bar */}
        <View style={[styles.navBar, { paddingTop: topInset + 8, paddingBottom: 12 }]}>
          <TouchableOpacity onPress={onClose} style={styles.navButton} hitSlop={15}>
            <Ionicons name="chevron-back" size={28} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>
            {playlist.title || playlist.name}
          </Text>
          <View style={styles.navRight}>
            <TouchableOpacity onPress={openSettings} style={styles.navButton} hitSlop={15}>
              <Ionicons name="settings-outline" size={22} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeletePlaylist} style={styles.navButton} hitSlop={15}>
              <Ionicons name="trash-outline" size={22} color={THEME.colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Playlist Header */}
        <View style={styles.headerContainer}>
          <View style={styles.artworkWrapper}>{renderMosaic()}</View>
          <Text style={styles.playlistTitle} numberOfLines={2}>
            {playlist.title || playlist.name}
          </Text>
          <Text style={styles.playlistSubtitle}>
            {playlistTracks.length} {playlistTracks.length === 1 ? t('trackCount') : t('tracksCount')}
            {totalMinutes > 0 ? ` • ${totalMinutes} min` : ''}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.playButton, playlistTracks.length === 0 && styles.buttonDisabled]}
              onPress={handlePlayAll}
              disabled={playlistTracks.length === 0}
            >
              <Ionicons name="play" size={18} color="#000000" />
              <Text style={styles.playButtonText}>{t('play')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shuffleButton, playlistTracks.length === 0 && styles.buttonDisabled]}
              onPress={handleShuffle}
              disabled={playlistTracks.length === 0}
            >
              <Ionicons name="shuffle" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addSongsButton}
              onPress={() => setAddSongsModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addSongsButtonText}>{t('addSongs')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Playlist Songs List */}
        {playlistTracks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={54} color={THEME.colors.textTertiary} />
            <Text style={styles.emptyTitle}>{t('playlistEmpty')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('playlistEmptySubtitle')}
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => setAddSongsModalVisible(true)}
            >
              <Ionicons name="add-circle" size={20} color="#000000" />
              <Text style={styles.emptyAddButtonText}>{t('addSongsToPlaylist')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={playlistTracks}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const isPlaying = currentTrack?.id === item.id;
              return (
                <View style={[styles.trackRow, isPlaying && styles.trackRowActive]}>
                  <TouchableOpacity
                    style={styles.trackMain}
                    onPress={() => {
                      if (isPlaying) {
                        setFullPlayerVisible(true);
                      } else {
                        playTrack(item, playlistTracks);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.trackIndex}>{index + 1}</Text>
                    {item.artworkUri || item.artwork ? (
                      <Image source={{ uri: item.artworkUri || item.artwork }} style={styles.trackThumb} />
                    ) : (
                      <View style={[styles.trackThumb, styles.trackThumbPlaceholder]}>
                        <Ionicons name="musical-notes" size={18} color={THEME.colors.textTertiary} />
                      </View>
                    )}
                    <View style={styles.trackInfo}>
                      <Text
                        style={[styles.trackTitle, isPlaying && styles.trackTitleActive]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>
                        {item.artist || 'Unknown Artist'}
                      </Text>
                    </View>
                    <Text style={styles.trackDuration}>{formatTime(item.duration || 0)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveTrack(item.id)}
                    hitSlop={10}
                  >
                    <Ionicons name="remove-circle-outline" size={22} color={THEME.colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              );
            }}
            contentContainerStyle={[
              styles.listContent,
              currentTrack ? { paddingBottom: 110 } : null,
            ]}
          />
        )}

        {/* Add Songs Picker Modal */}
        <Modal visible={addSongsModalVisible} animationType="slide" transparent>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Add Songs</Text>
                <TouchableOpacity onPress={() => setAddSongsModalVisible(false)} hitSlop={10}>
                  <Ionicons name="close" size={24} color={THEME.colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {availableTracksToAdd.length === 0 ? (
                <View style={styles.emptyPicker}>
                  <Text style={styles.emptyPickerText}>
                    All your library tracks are already in this playlist!
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={availableTracksToAdd}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const isSelected = selectedTrackIdsToAdd.has(item.id);
                    return (
                      <TouchableOpacity
                        style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                        onPress={() => toggleSelectTrackToAdd(item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          {isSelected && <Ionicons name="checkmark" size={14} color="#000000" />}
                        </View>
                        {item.artworkUri || item.artwork ? (
                          <Image
                            source={{ uri: item.artworkUri || item.artwork }}
                            style={styles.pickerThumb}
                          />
                        ) : (
                          <View style={[styles.pickerThumb, styles.trackThumbPlaceholder]}>
                            <Ionicons name="musical-notes" size={16} color={THEME.colors.textTertiary} />
                          </View>
                        )}
                        <View style={styles.pickerItemInfo}>
                          <Text style={styles.pickerItemTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.pickerItemArtist} numberOfLines={1}>
                            {item.artist || 'Unknown Artist'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  style={{ maxHeight: 400 }}
                  contentContainerStyle={{ paddingBottom: 16 }}
                />
              )}

              {availableTracksToAdd.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.confirmAddButton,
                    selectedTrackIdsToAdd.size === 0 && styles.buttonDisabled,
                  ]}
                  onPress={handleConfirmAddSongs}
                  disabled={selectedTrackIdsToAdd.size === 0}
                >
                  <Text style={styles.confirmAddButtonText}>
                    Add {selectedTrackIdsToAdd.size > 0 ? `(${selectedTrackIdsToAdd.size}) ` : ''}Songs
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

        {/* Floating Mini Player inside playlist detail */}
        {currentTrack && (
          <View style={styles.miniPlayerContainer}>
            <MiniPlayer onExpand={() => setFullPlayerVisible(true)} />
          </View>
        )}

        {/* Full Screen Player Modal */}
        <FullPlayer
          visible={fullPlayerVisible}
          onClose={() => setFullPlayerVisible(false)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  miniPlayerContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 20,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    padding: 6,
  },
  navTitle: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  artworkWrapper: {
    width: 170,
    height: 170,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  mosaicFull: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  playlistTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  playlistSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  playButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  shuffleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSongsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
  },
  addSongsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    marginTop: 20,
  },
  emptyAddButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 14,
  },
  trackRowActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  trackMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackIndex: {
    color: THEME.colors.textTertiary,
    fontSize: 13,
    width: 24,
    textAlign: 'center',
    marginRight: 6,
  },
  trackThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 12,
  },
  trackThumbPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  trackTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackTitleActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  trackArtist: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
  },
  trackDuration: {
    color: THEME.colors.textTertiary,
    fontSize: 12,
    marginRight: 10,
  },
  removeButton: {
    padding: 6,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: 'rgba(22, 22, 28, 0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyPicker: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyPickerText: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  pickerThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
  },
  pickerItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  pickerItemTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  pickerItemArtist: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
  },
  confirmAddButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmAddButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
});
