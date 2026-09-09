import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { THEME, GRADIENT_PRESETS, ThemePreset } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

const { width } = Dimensions.get('window');

interface AppThemeScreenProps {
  onBack: () => void;
}

export const AppThemeScreen: React.FC<AppThemeScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 54);

  const { settings, activeTheme, updateGradient } = useSettings();
  const flatListRef = useRef<FlatList>(null);

  const handleSelectTheme = async (preset: ThemePreset) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateGradient(preset.id);
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Ambient Glow Behind Preview */}
      <View style={styles.ambientGlowContainer} pointerEvents="none">
        <LinearGradient
          colors={[activeTheme.ambientGlow, 'transparent']}
          style={styles.ambientGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topInset + 8, paddingBottom: 14 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={15}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Theme</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Live Preview Container (Discord Style) */}
      <View style={styles.previewContainer}>
        <View style={[styles.previewWindow, { borderColor: 'rgba(255, 255, 255, 0.16)' }]}>
          {/* Ambient Preview Background */}
          <LinearGradient
            colors={activeTheme.colors}
            style={styles.previewGradientBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Mock Header */}
            <View style={styles.mockHeader}>
              <Text style={styles.mockHeaderTitle}>Now Playing</Text>
              <View style={styles.mockHeaderIcons}>
                <View style={[styles.mockDot, { backgroundColor: activeTheme.accentColor }]} />
                <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255, 255, 255, 0.6)" />
              </View>
            </View>

            {/* Featured Track Card */}
            <View style={[styles.mockFeaturedCard, { backgroundColor: activeTheme.cardBackground }]}>
              <View style={[styles.mockArtwork, { backgroundColor: activeTheme.accentColor + '30' }]}>
                <Ionicons name="musical-notes" size={24} color={activeTheme.accentColor} />
              </View>
              <View style={styles.mockFeaturedInfo}>
                <Text style={styles.mockFeaturedTitle} numberOfLines={1}>
                  I'Morphiniya 33
                </Text>
                <Text style={styles.mockFeaturedArtist} numberOfLines={1}>
                  L'Morphine • Master Track
                </Text>
                {/* Mock Progress Bar */}
                <View style={styles.mockProgressBarBg}>
                  <View
                    style={[
                      styles.mockProgressBarFill,
                      { backgroundColor: activeTheme.accentColor, width: '45%' },
                    ]}
                  />
                </View>
              </View>
              <View style={[styles.mockPlayCircle, { backgroundColor: activeTheme.accentColor }]}>
                <Ionicons name="play" size={12} color="#000000" />
              </View>
            </View>

            {/* Mock Track List Rows */}
            <View style={styles.mockTrackList}>
              <View style={styles.mockRow}>
                <View style={styles.mockAvatarContainer}>
                  <View style={[styles.mockAvatar, { backgroundColor: '#3A3D4D' }]}>
                    <Ionicons name="disc" size={16} color="#FFFFFF" />
                  </View>
                  <View style={[styles.mockStatusDot, { backgroundColor: activeTheme.accentColor }]} />
                </View>
                <View style={styles.mockRowContent}>
                  <View style={styles.mockRowTop}>
                    <Text style={styles.mockRowTitle}>Aujiss - Fin</Text>
                    <Text style={styles.mockRowTime}>3:15</Text>
                  </View>
                  <Text style={styles.mockRowSub} numberOfLines={1}>
                    Aujiss • Ambient Echoes
                  </Text>
                </View>
              </View>

              <View style={styles.mockRow}>
                <View style={styles.mockAvatarContainer}>
                  <View style={[styles.mockAvatar, { backgroundColor: '#2C2F3F' }]}>
                    <Ionicons name="headset" size={16} color="#FFFFFF" />
                  </View>
                  <View style={[styles.mockStatusDot, { backgroundColor: '#34D399' }]} />
                </View>
                <View style={styles.mockRowContent}>
                  <View style={styles.mockRowTop}>
                    <Text style={styles.mockRowTitle}>Midnight Session</Text>
                    <Text style={styles.mockRowTime}>4:28</Text>
                  </View>
                  <Text style={styles.mockRowSub} numberOfLines={1}>
                    Chill Beats • Lo-Fi Lounge
                  </Text>
                </View>
              </View>

              <View style={styles.mockRow}>
                <View style={styles.mockAvatarContainer}>
                  <View style={[styles.mockAvatar, { backgroundColor: '#252735' }]}>
                    <Ionicons name="radio" size={16} color="#FFFFFF" />
                  </View>
                  <View style={[styles.mockStatusDot, { backgroundColor: activeTheme.accentColor }]} />
                </View>
                <View style={styles.mockRowContent}>
                  <View style={styles.mockRowTop}>
                    <Text style={styles.mockRowTitle}>Neon Skyline</Text>
                    <Text style={styles.mockRowTime}>3:42</Text>
                  </View>
                  <Text style={styles.mockRowSub} numberOfLines={1}>
                    Synthwave Groove • 2026 Edition
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* Theme Swatch Carousel (Discord Style) */}
      <View style={styles.carouselSection}>
        <FlatList
          ref={flatListRef}
          data={GRADIENT_PRESETS}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          renderItem={({ item, index }) => {
            const isSelected = activeTheme.id === item.id;
            const isOled = item.id === 'oled';

            return (
              <TouchableOpacity
                style={[
                  styles.swatchCard,
                  isSelected && [
                    styles.swatchCardSelected,
                    { borderColor: activeTheme.accentColor },
                  ],
                ]}
                onPress={() => handleSelectTheme(item)}
                activeOpacity={0.8}
              >
                {isOled ? (
                  <View style={[styles.swatchInner, { backgroundColor: '#000000' }]}>
                    <Ionicons name="refresh" size={20} color="rgba(255, 255, 255, 0.7)" />
                  </View>
                ) : (
                  <LinearGradient
                    colors={item.colors}
                    style={styles.swatchInner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Selected Theme Details & Hint */}
      <View style={styles.footerSection}>
        <View style={styles.themeNameRow}>
          <Ionicons
            name={(activeTheme.icon as any) || 'sparkles'}
            size={18}
            color={activeTheme.accentColor}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.themeNameText}>{activeTheme.name}</Text>
        </View>
        <Text style={styles.themeHintText}>You can always change this later!</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  ambientGlowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 420,
    zIndex: 0,
  },
  ambientGlow: {
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 10,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRightPlaceholder: {
    width: 36,
  },
  previewContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    zIndex: 10,
  },
  previewWindow: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  previewGradientBg: {
    padding: 16,
    minHeight: 370,
  },
  mockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  mockHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  mockHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mockFeaturedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mockArtwork: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mockFeaturedInfo: {
    flex: 1,
  },
  mockFeaturedTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  mockFeaturedArtist: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    marginBottom: 6,
  },
  mockProgressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  mockProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  mockPlayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  mockTrackList: {
    gap: 12,
  },
  mockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  mockAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  mockAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#0E0E12',
  },
  mockRowContent: {
    flex: 1,
  },
  mockRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  mockRowTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mockRowTime: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
  },
  mockRowSub: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  carouselSection: {
    marginTop: 'auto',
    marginBottom: 16,
    zIndex: 10,
  },
  carouselContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  swatchCard: {
    width: 58,
    height: 80,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  },
  swatchCardSelected: {
    borderWidth: 2.5,
    transform: [{ scale: 1.05 }],
  },
  swatchInner: {
    flex: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerSection: {
    alignItems: 'center',
    paddingBottom: 24,
    zIndex: 10,
  },
  themeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  themeNameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  themeHintText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
  },
});
