import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput,
  ScrollView,
  Modal,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { THEME } from '../constants/theme';
import { Track, Playlist } from '../types/music';
import { 
  getAllTracks, 
  getAllPlaylists, 
  toggleFavorite, 
  deleteTrack, 
  updateTrackMeta,
  savePlaylist,
  addTrackToPlaylist
} from '../services/storageService';
import { importAudioFiles } from '../services/importService';
import { useAudio } from '../context/AudioContext';
import { TrackItem } from '../components/TrackItem';
import { PlaylistCard } from '../components/PlaylistCard';
import { TagEditor } from '../components/TagEditor';
import { PlaylistDetailModal } from '../components/PlaylistDetailModal';
import { useSettings } from '../context/SettingsContext';
import { generateId } from '../utils/helpers';

type Tab = 'All' | 'Favorites' | 'Playlists' | 'Downloaded';
const TABS: Tab[] = ['All', 'Favorites', 'Playlists', 'Downloaded'];

export const LibraryScreen = () => {
  const { currentTrack, playTrack } = useAudio();
  const { settings, t, openSettings } = useSettings();
  
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  
  // Modals state
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [tagEditorVisible, setTagEditorVisible] = useState(false);
  
  const [createPlaylistModalVisible, setCreatePlaylistModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playlistSelectorVisible, setPlaylistSelectorVisible] = useState(false);

  // Playlist detail state
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [playlistDetailVisible, setPlaylistDetailVisible] = useState(false);

  const loadData = async () => {
    const loadedTracks = await getAllTracks();
    const loadedPlaylists = await getAllPlaylists();
    setTracks(loadedTracks);
    setPlaylists(loadedPlaylists);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImport = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await importAudioFiles();
    if (success) {
      loadData();
    }
  };

  const filteredTracks = useMemo(() => {
    let filtered = tracks;
    
    if (activeTab === 'Favorites') {
      filtered = filtered.filter(t => t.isFavorite);
    } else if (activeTab === 'Downloaded') {
      filtered = filtered.filter(t => t.source === 'youtube' || t.source === 'local_import' || t.isDownloaded);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(q) || 
        (t.artist && t.artist.toLowerCase().includes(q))
      );
    }
    
    return filtered;
  }, [tracks, activeTab, searchQuery]);

  const handleTrackPress = (track: Track) => {
    playTrack(track, filteredTracks);
  };

  const handleToggleFavorite = async (track: Track) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = await toggleFavorite(track.id);
    if (updated) loadData();
  };

  const handleOptionsPress = (track: Track) => {
    setSelectedTrack(track);
    setOptionsModalVisible(true);
  };

  const handleDelete = async () => {
    if (selectedTrack) {
      await deleteTrack(selectedTrack.id);
      loadData();
      setOptionsModalVisible(false);
    }
  };

  const handleSaveTags = async (updates: { title: string; artist: string; artworkUri?: string }) => {
    if (selectedTrack) {
      await updateTrackMeta(selectedTrack.id, updates);
      loadData();
    }
  };

  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim()) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newPlaylist: Playlist = {
        id: generateId(),
        title: newPlaylistName.trim(),
        name: newPlaylistName.trim(),
        trackIds: selectedTrack ? [selectedTrack.id] : [],
        createdAt: Date.now(),
      };
      await savePlaylist(newPlaylist);
      setNewPlaylistName('');
      setCreatePlaylistModalVisible(false);
      setSelectedTrack(null);
      await loadData();
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (selectedTrack) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await addTrackToPlaylist(playlistId, selectedTrack.id);
      setPlaylistSelectorVisible(false);
      setOptionsModalVisible(false);
      setSelectedTrack(null);
      await loadData();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('library')}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.importButton} onPress={handleImport}>
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.importText}>{t('import')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={openSettings}
            activeOpacity={0.7}
            hitSlop={10}
          >
            {settings.pfpUri ? (
              <Image source={{ uri: settings.pfpUri }} style={styles.headerPfp} />
            ) : (
              <View style={styles.headerSettingsIcon}>
                <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TABS.map(tab => {
            const labelKey = tab === 'All' ? 'all' : tab === 'Favorites' ? 'favorites' : tab === 'Playlists' ? 'playlists' : 'downloaded';
            return (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {t(labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {activeTab !== 'Playlists' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={THEME.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchTracks')}
            placeholderTextColor={THEME.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {activeTab === 'Playlists' ? (
        <ScrollView contentContainerStyle={styles.playlistsGrid}>
          <TouchableOpacity 
            style={styles.createPlaylistCard}
            onPress={() => setCreatePlaylistModalVisible(true)}
          >
            <View style={styles.createPlaylistIcon}>
              <Ionicons name="add" size={40} color={THEME.colors.accent} />
            </View>
            <Text style={styles.createPlaylistText}>{t('newPlaylist')}</Text>
          </TouchableOpacity>
          
          {playlists.map(playlist => {
            const playlistTracks = playlist.trackIds
              .map(id => tracks.find(t => t.id === id))
              .filter((t): t is Track => t !== undefined);
              
            return (
              <PlaylistCard 
                key={playlist.id}
                playlist={playlist}
                tracks={playlistTracks}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActivePlaylist(playlist);
                  setPlaylistDetailVisible(true);
                }}
              />
            );
          })}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredTracks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TrackItem
              track={item}
              isPlaying={currentTrack?.id === item.id}
              onPress={() => handleTrackPress(item)}
              onToggleFavorite={() => handleToggleFavorite(item)}
              onOptions={() => handleOptionsPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Options Modal */}
      <Modal visible={optionsModalVisible} transparent animationType="slide" onRequestClose={() => setOptionsModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOptionsModalVisible(false)}>
          <View style={styles.optionsModal}>
            <View style={styles.optionsHeader}>
              {(selectedTrack?.artworkUri || selectedTrack?.artwork) ? (
                <Image source={{ uri: selectedTrack?.artworkUri || selectedTrack?.artwork }} style={styles.optionsArtwork} />
              ) : (
                <View style={[styles.optionsArtwork, styles.placeholderArtwork]}>
                  <Ionicons name="musical-notes" size={24} color={THEME.colors.textSecondary} />
                </View>
              )}
              <View style={styles.optionsInfo}>
                <Text style={styles.optionsTitle} numberOfLines={1}>{selectedTrack?.title}</Text>
                <Text style={styles.optionsArtist} numberOfLines={1}>{selectedTrack?.artist}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.optionRow} onPress={() => {
              if (selectedTrack) handleToggleFavorite(selectedTrack);
              setOptionsModalVisible(false);
            }}>
              <Ionicons name={selectedTrack?.isFavorite ? "heart" : "heart-outline"} size={24} color={THEME.colors.textPrimary} />
              <Text style={styles.optionText}>{selectedTrack?.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow} onPress={() => {
              setOptionsModalVisible(false);
              setTimeout(() => setPlaylistSelectorVisible(true), 250);
            }}>
              <Ionicons name="list-outline" size={24} color={THEME.colors.textPrimary} />
              <Text style={styles.optionText}>Add to Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow} onPress={() => {
              setOptionsModalVisible(false);
              setTagEditorVisible(true);
            }}>
              <Ionicons name="pricetag-outline" size={24} color={THEME.colors.textPrimary} />
              <Text style={styles.optionText}>Edit Tags</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color={THEME.colors.error} />
              <Text style={[styles.optionText, { color: THEME.colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Playlist Selector Modal for adding a track */}
      <Modal visible={playlistSelectorVisible} transparent animationType="slide" onRequestClose={() => setPlaylistSelectorVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPlaylistSelectorVisible(false)}>
          <View style={styles.optionsModal}>
            <Text style={styles.modalTitle}>Add to Playlist</Text>

            <TouchableOpacity
              style={[styles.optionRow, { borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)', marginBottom: 8, paddingBottom: 12 }]}
              onPress={() => {
                setPlaylistSelectorVisible(false);
                setTimeout(() => setCreatePlaylistModalVisible(true), 250);
              }}
            >
              <Ionicons name="add-circle" size={24} color="#FFFFFF" />
              <Text style={[styles.optionText, { fontWeight: '600' }]}>New Playlist</Text>
            </TouchableOpacity>

            {playlists.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ color: THEME.colors.textSecondary, fontSize: 14 }}>No playlists found</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {playlists.map(p => (
                  <TouchableOpacity key={p.id} style={styles.optionRow} onPress={() => handleAddToPlaylist(p.id)}>
                    <Ionicons name="musical-notes-outline" size={24} color={THEME.colors.textPrimary} />
                    <Text style={styles.optionText}>{p.title || p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Create Playlist Modal */}
      <Modal visible={createPlaylistModalVisible} transparent animationType="fade" onRequestClose={() => setCreatePlaylistModalVisible(false)}>
        <View style={styles.centerModalOverlay}>
          <View style={styles.centerModal}>
            <Text style={styles.modalTitle}>New Playlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Playlist name"
              placeholderTextColor={THEME.colors.textSecondary}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setCreatePlaylistModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleCreatePlaylist}>
                <Text style={styles.modalButtonPrimaryText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tag Editor Modal */}
      <TagEditor
        visible={tagEditorVisible}
        track={selectedTrack}
        onSave={handleSaveTags}
        onClose={() => setTagEditorVisible(false)}
      />

      {/* Playlist Detail Modal */}
      <PlaylistDetailModal
        visible={playlistDetailVisible}
        playlist={activePlaylist}
        allTracks={tracks}
        onClose={() => {
          setPlaylistDetailVisible(false);
          setActivePlaylist(null);
        }}
        onPlaylistUpdated={async () => {
          await loadData();
          if (activePlaylist) {
            const updatedPlaylists = await getAllPlaylists();
            const refreshed = updatedPlaylists.find(p => p.id === activePlaylist.id);
            if (refreshed) {
              setActivePlaylist(refreshed);
            }
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsButton: {
    marginLeft: 2,
  },
  headerPfp: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  headerSettingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  importText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 13,
  },
  tabsContainer: {
    marginBottom: THEME.spacing.md,
  },
  tabsScroll: {
    paddingHorizontal: THEME.spacing.lg,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  tabText: {
    color: THEME.colors.textSecondary,
    fontWeight: '500',
    fontSize: 13,
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: THEME.colors.textPrimary,
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 100,
  },
  playlistsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 100,
  },
  createPlaylistCard: {
    width: 160,
    height: 200,
    marginRight: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  createPlaylistIcon: {
    width: 160,
    height: 160,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  createPlaylistText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  optionsModal: {
    backgroundColor: 'rgba(20, 20, 26, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  optionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionsArtwork: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: THEME.spacing.md,
  },
  placeholderArtwork: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsInfo: {
    flex: 1,
  },
  optionsTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  optionsArtist: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: THEME.spacing.md,
  },
  optionText: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    marginLeft: THEME.spacing.md,
  },
  centerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  centerModal: {
    backgroundColor: 'rgba(22, 22, 28, 0.95)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: THEME.spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: THEME.spacing.md,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: THEME.spacing.md,
    color: THEME.colors.textPrimary,
    fontSize: 16,
    marginBottom: THEME.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: THEME.spacing.md,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  modalButtonPrimary: {
    backgroundColor: '#FFFFFF',
  },
  modalButtonText: {
    color: THEME.colors.textSecondary,
    fontSize: 15,
  },
  modalButtonPrimaryText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
