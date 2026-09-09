import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AudioProvider, useAudio } from './src/context/AudioContext';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { MiniPlayer } from './src/components/MiniPlayer';
import { FullPlayer } from './src/components/FullPlayer';
import { SettingsModal } from './src/components/SettingsModal';
import { THEME } from './src/constants/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

type TabName = 'home' | 'search' | 'library';

interface TabConfig {
  name: TabName;
  labelKey: 'home' | 'search' | 'library';
  icon: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
  { name: 'home', labelKey: 'home', icon: 'home-outline', iconFilled: 'home' },
  { name: 'search', labelKey: 'search', icon: 'search-outline', iconFilled: 'search' },
  { name: 'library', labelKey: 'library', icon: 'library-outline', iconFilled: 'library' },
];

function MainApp() {
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const { currentTrack } = useAudio();
  const { settingsVisible, closeSettings, t, gradientColors, activeTheme } = useSettings();
  const insets = useSafeAreaInsets();

  const hasMiniPlayer = currentTrack !== null;
  const tabBarHeight = 50 + insets.bottom;
  const miniPlayerHeight = hasMiniPlayer ? 64 : 0;

  const handleTabPress = useCallback((tab: TabName) => {
    setActiveTab(tab);
  }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onNavigateToSearch={() => setActiveTab('search')}
          />
        );
      case 'search':
        return <SearchScreen />;
      case 'library':
        return <LibraryScreen />;
      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Screen Content */}
      <View
        style={[
          styles.screenContainer,
          { paddingBottom: tabBarHeight + miniPlayerHeight },
        ]}
      >
        {renderScreen()}
      </View>

      {/* Mini Player (above tab bar) */}
      {hasMiniPlayer && (
        <View
          style={[
            styles.miniPlayerContainer,
            { bottom: tabBarHeight + 6 },
          ]}
        >
          <MiniPlayer onExpand={() => setIsPlayerExpanded(true)} />
        </View>
      )}

      {/* Tab Bar */}
      <View style={[styles.tabBarWrapper, { height: tabBarHeight }]}>
        <BlurView intensity={95} tint="dark" style={styles.tabBarBlur}>
          <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.name;
              return (
                <TouchableOpacity
                  key={tab.name}
                  style={styles.tabItem}
                  onPress={() => handleTabPress(tab.name)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabIconWrapper, isActive && styles.tabIconWrapperActive]}>
                    <Ionicons
                      name={isActive ? tab.iconFilled : tab.icon}
                      size={22}
                      color={isActive ? activeTheme.accentColor : THEME.colors.textTertiary}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>

      {/* Full Screen Player Modal */}
      <FullPlayer
        visible={isPlayerExpanded}
        onClose={() => setIsPlayerExpanded(false)}
      />

      {/* Global Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        onClose={closeSettings}
      />
    </LinearGradient>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AudioProvider>
        <SettingsProvider>
          <MainApp />
        </SettingsProvider>
      </AudioProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  screenContainer: {
    flex: 1,
  },
  miniPlayerContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 10,
  },
  tabBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  tabBarBlur: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.glassBorder,
    backgroundColor: 'rgba(10, 10, 14, 0.65)',
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabIconWrapper: {
    width: 44,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapperActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
});
