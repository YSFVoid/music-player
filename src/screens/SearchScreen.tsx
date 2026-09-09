import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Keyboard, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SearchResultItem } from '../components/SearchResultItem';
import { THEME } from '../constants/theme';
import { searchYouTube, getAudioStreamUrl, downloadYouTubeAudio, batchDownload } from '../services/youtubeService';
import { YouTubeSearchResult, Track } from '../types/music';
import { useAudio } from '../context/AudioContext';

export const SearchScreen: React.FC = () => {
  const { playTrack } = useAudio();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [downloadingItems, setDownloadingItems] = useState<{ [id: string]: number }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message: string) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start(() => setToastMessage(null));
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const data = await searchYouTube(searchQuery);
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      showToast('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleTextChange = (text: string) => {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      performSearch(text);
    }, 300);
  };

  const handlePreview = async (item: YouTubeSearchResult) => {
    try {
      showToast('Loading preview...');
      const url = await getAudioStreamUrl(item.id);
      if (!url) {
        showToast('Stream unavailable');
        return;
      }

      const previewTrack: Track = {
        id: `yt_${item.id}`,
        title: item.title,
        artist: item.artist,
        duration: item.duration || 0,
        uri: url,
        artworkUri: item.thumbnail,
        artwork: item.thumbnail,
        source: 'youtube',
        youtubeId: item.id,
        addedAt: Date.now(),
      };

      playTrack(previewTrack);
    } catch (error) {
      console.error('Preview failed:', error);
      showToast('Preview unavailable');
    }
  };

  const handleDownload = async (item: YouTubeSearchResult) => {
    try {
      setDownloadingItems(prev => ({ ...prev, [item.id]: 0.05 }));

      const track = await downloadYouTubeAudio(item.id, item, (progress) => {
        setDownloadingItems(prev => ({ ...prev, [item.id]: Math.max(0.05, progress) }));
      });

      setDownloadingItems(prev => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

      if (track) {
        showToast(`${item.title} downloaded!`);
      } else {
        showToast('Download failed');
      }
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadingItems(prev => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      showToast('Download failed');
    }
  };

  const toggleSelection = (id: string) => {
    if (!isBatchMode) setIsBatchMode(true);
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) setIsBatchMode(false);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBatchDownload = async () => {
    const selectedItems = results.filter(r => selectedIds.has(r.id));
    const ids = Array.from(selectedIds);
    setIsBatchMode(false);
    setSelectedIds(new Set());
    
    // Set initial progress for all
    setDownloadingItems(prev => {
      const next = { ...prev };
      ids.forEach(id => { next[id] = 0.1; });
      return next;
    });

    try {
      await batchDownload(selectedItems);
      showToast(`${ids.length} tracks downloaded!`);
    } catch (error) {
      console.error('Batch download failed:', error);
      showToast('Some downloads failed');
    } finally {
      setDownloadingItems(prev => {
        const next = { ...prev };
        ids.forEach(id => { delete next[id]; });
        return next;
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={THEME.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search or paste YouTube link..."
            placeholderTextColor={THEME.colors.textTertiary}
            value={query}
            onChangeText={handleTextChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => performSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleTextChange('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color={THEME.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { Keyboard.dismiss(); performSearch(query); }}>
            <Text style={styles.searchActionText}>Search</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {isSearching ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={THEME.colors.accent} />
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={64} color={THEME.colors.surfaceElevated} />
            <Text style={styles.emptyText}>Search for a song or paste a YouTube link</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SearchResultItem
                item={item}
                onPreview={() => handlePreview(item)}
                onDownload={() => handleDownload(item)}
                isSelectable={isBatchMode}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelection(item.id)}
                isDownloading={downloadingItems[item.id] !== undefined}
                downloadProgress={downloadingItems[item.id]}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {isBatchMode && selectedIds.size > 0 && (
        <View style={styles.batchBottomBar}>
          <TouchableOpacity style={styles.batchButton} onPress={handleBatchDownload}>
            <Ionicons name="cloud-download" size={18} color="#000000" style={styles.batchIcon} />
            <Text style={styles.batchButtonText}>Download {selectedIds.size} selected</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBatchButton} onPress={() => { setIsBatchMode(false); setSelectedIds(new Set()); }}>
            <Text style={styles.cancelBatchText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {toastMessage && (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: THEME.spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 15,
    height: '100%',
  },
  clearButton: {
    padding: THEME.spacing.xs,
  },
  searchActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.xl,
  },
  emptyText: {
    color: THEME.colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: THEME.spacing.md,
    lineHeight: 22,
  },
  listContent: {
    paddingBottom: THEME.spacing.xl,
  },
  batchBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20, 20, 26, 0.95)',
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batchButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    marginRight: THEME.spacing.md,
  },
  batchIcon: {
    marginRight: 6,
  },
  batchButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBatchButton: {
    padding: THEME.spacing.sm,
  },
  cancelBatchText: {
    color: THEME.colors.textSecondary,
    fontSize: 15,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(28, 28, 34, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toastText: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
});
