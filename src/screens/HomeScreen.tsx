import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import {
  getRecentTracks,
  getFavorites,
  getAllPlaylists,
  getAllTracks,
  getListeningStats,
  getTopTracks,
} from '../services/storageService';
import { importAudioFiles } from '../services/importService';
import { useAudio } from '../context/AudioContext';
import { Track, Playlist, ListeningStats } from '../types/music';
import { THEME } from '../constants/theme';
import { getGreeting, formatListeningTime } from '../utils/helpers';
import { PlaylistCard } from '../components/PlaylistCard';
import { PlaylistDetailModal } from '../components/PlaylistDetailModal';
import { useSettings } from '../context/SettingsContext';

interface HomeScreenProps {
  onNavigateToSearch?: () => void;
}

export const HomeScreen = ({ onNavigateToSearch }: HomeScreenProps) => {
  const { playTrack } = useAudio();
  const { settings, gradientColors, t, openSettings } = useSettings();

  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [topTrackName, setTopTrackName] = useState<string | null>(null);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Playlist detail state
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [playlistDetailVisible, setPlaylistDetailVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [_stats, _topTracks, _recentTracks, _favorites, _playlists, _allTracks] =
        await Promise.all([
          getListeningStats(),
          getTopTracks(1),
          getRecentTracks(),
          getFavorites(),
          getAllPlaylists(),
          getAllTracks(),
        ]);

      setStats(_stats);
      setRecentTracks(_recentTracks);
      setFavorites(_favorites);
      setPlaylists(_playlists);
      setAllTracks(_allTracks);

      // Resolve top track name
      if (_topTracks.length > 0) {
        const topTrack = _allTracks.find((t) => t.id === _topTracks[0].trackId);
        setTopTrackName(topTrack?.title || null);
      } else {
        setTopTrackName(null);
      }
    } catch (error) {
      console.error('Error loading home screen data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleImport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const added = await importAudioFiles();
    if (added && added.length > 0) {
      loadData();
    }
  };

  const renderTrackItem = ({ item }: { item: Track }) => (
    <TouchableOpacity
      style={styles.trackCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        playTrack(item, recentTracks.length > 0 ? recentTracks : [item]);
      }}
    >
      {item.artworkUri ? (
        <Image source={{ uri: item.artworkUri }} style={styles.trackArtwork} />
      ) : (
        <View style={[styles.trackArtwork, styles.trackArtworkPlaceholder]}>
          <Ionicons name="musical-notes" size={32} color={THEME.colors.textTertiary} />
        </View>
      )}
      <Text style={styles.trackTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.trackArtist} numberOfLines={1}>
        {item.artist}
      </Text>
    </TouchableOpacity>
  );

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const formattedDate = currentDate;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        bounces
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateText}>{formattedDate}</Text>
            <Text style={styles.greetingText}>
              {getGreeting()}{settings.name ? `, ${settings.name}` : ''}
            </Text>
          </View>
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

        {/* Mon Replay Card */}
        <LinearGradient
          colors={gradientColors}
          style={styles.replayCard}
        >
          <View style={styles.replayIconContainer}>
            <Ionicons name="headset" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.replayInfo}>
            {stats && stats.totalSecondsListened > 0 ? (
              <>
                <Text style={styles.replayTitle}>
                  {formatListeningTime(stats.totalSecondsListened)} {t('hoursListened')}
                </Text>
                {topTrackName && (
                  <Text style={styles.replaySubtitle} numberOfLines={1}>
                    {t('topTrack')}: {topTrackName}
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.replayTitle}>{t('startListening')}</Text>
            )}
          </View>
        </LinearGradient>

        {/* Écoutés récemment */}
        {recentTracks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('recentlyPlayed')}</Text>
            <FlatList
              data={recentTracks}
              renderItem={renderTrackItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Coups de cœur */}
        {favorites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('favorites')}</Text>
            <FlatList
              data={favorites}
              renderItem={renderTrackItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Playlists */}
        {playlists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('playlists')}</Text>
            <FlatList
              data={playlists}
              renderItem={({ item }) => (
                <View style={{ marginRight: THEME.spacing.md }}>
                  <PlaylistCard
                    playlist={item}
                    tracks={allTracks.filter((t) => item.trackIds.includes(t.id))}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActivePlaylist(item);
                      setPlaylistDetailVisible(true);
                    }}
                  />
                </View>
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onNavigateToSearch?.();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconWrapper}>
              <Ionicons name="cloud-download" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>{t('download')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={handleImport}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconWrapper}>
              <Ionicons name="folder-open" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>{t('importMp3')}</Text>
          </TouchableOpacity>
        </View>

        {/* Empty state */}
        {allTracks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="musical-notes" size={48} color={THEME.colors.textTertiary} />
            <Text style={styles.emptyTitle}>{t('libraryEmpty')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('libraryEmptySubtitle')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Playlist Detail Modal */}
      <PlaylistDetailModal
        visible={playlistDetailVisible}
        playlist={activePlaylist}
        allTracks={allTracks}
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
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  settingsButton: {
    marginLeft: 12,
  },
  headerPfp: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  headerSettingsIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  replayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: THEME.spacing.lg,
    borderRadius: 20,
    padding: 16,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  replayIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  replayInfo: {
    flex: 1,
  },
  replayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.2,
  },
  replaySubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    letterSpacing: -0.3,
  },
  horizontalList: {
    paddingHorizontal: THEME.spacing.lg,
  },
  trackCard: {
    width: 130,
    marginRight: THEME.spacing.md,
  },
  trackArtwork: {
    width: 130,
    height: 130,
    borderRadius: 16,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  trackArtworkPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.2,
  },
  trackArtist: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: THEME.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginTop: THEME.spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: THEME.spacing.sm,
    lineHeight: 20,
  },
});
