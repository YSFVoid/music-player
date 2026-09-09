import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { THEME, GRADIENT_PRESETS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { Language } from '../constants/translations';
import { AppThemeScreen } from './AppThemeScreen';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 54);

  const {
    settings,
    activeTheme,
    gradientColors,
    t,
    updateName,
    updatePfp,
    updateGradient,
    updateLanguage,
  } = useSettings();

  const [currentScreen, setCurrentScreen] = useState<'main' | 'theme'>('main');
  const [nameInput, setNameInput] = useState(settings.name);
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    setNameInput(settings.name);
  }, [settings.name]);

  useEffect(() => {
    if (!visible) {
      setCurrentScreen('main');
    }
  }, [visible]);

  const handlePickImage = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await updatePfp(result.assets[0].uri);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  const handleRemoveImage = async () => {
    Alert.alert(
      t('removePhoto'),
      'Are you sure you want to remove your profile photo?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await updatePfp(null);
          },
        },
      ]
    );
  };

  const handleSaveName = async () => {
    if (nameInput.trim()) {
      setIsSavingName(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await updateName(nameInput.trim());
      setIsSavingName(false);
    }
  };

  const handleSelectGradient = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateGradient(id);
  };

  const handleSelectLanguage = async (lang: Language) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateLanguage(lang);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {currentScreen === 'theme' ? (
        <AppThemeScreen onBack={() => setCurrentScreen('main')} />
      ) : (
        <View style={styles.container}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: topInset + 10, paddingBottom: 16 }]}>
            <Text style={styles.headerTitle}>{t('settingsTitle')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.doneButton} hitSlop={15}>
              <Text style={styles.doneButtonText}>{t('done')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* PROFILE SECTION (Discord Style) */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>{t('profileSection')}</Text>

              <View style={styles.card}>
                <View style={styles.pfpRow}>
                  <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper} activeOpacity={0.8}>
                    {settings.pfpUri ? (
                      <Image source={{ uri: settings.pfpUri }} style={styles.avatar} />
                    ) : (
                      <LinearGradient colors={gradientColors} style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitials}>
                          {settings.name ? settings.name.charAt(0).toUpperCase() : 'Y'}
                        </Text>
                      </LinearGradient>
                    )}
                    {/* Discord-style Online Dot */}
                    <View style={[styles.discordStatusDot, { backgroundColor: activeTheme.accentColor }]} />
                    <View style={styles.cameraBadge}>
                      <Ionicons name="camera" size={12} color="#000000" />
                    </View>
                  </TouchableOpacity>

                  <View style={styles.pfpActions}>
                    <TouchableOpacity style={styles.actionPill} onPress={handlePickImage}>
                      <Ionicons name="image-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.actionPillText}>{t('changePhoto')}</Text>
                    </TouchableOpacity>

                    {settings.pfpUri && (
                      <TouchableOpacity style={styles.removePill} onPress={handleRemoveImage}>
                        <Text style={styles.removePillText}>{t('removePhoto')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('displayName')}</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.textInput}
                      value={nameInput}
                      onChangeText={setNameInput}
                      placeholder="Enter your name"
                      placeholderTextColor={THEME.colors.textTertiary}
                      maxLength={30}
                      returnKeyType="done"
                      onSubmitEditing={handleSaveName}
                    />
                    {nameInput.trim() !== settings.name && (
                      <TouchableOpacity
                        style={styles.saveNameButton}
                        onPress={handleSaveName}
                        disabled={isSavingName}
                      >
                        <Ionicons name="checkmark" size={18} color="#000000" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* APPEARANCE SECTION (Discord App Theme Row) */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>{t('appearanceSection')}</Text>

              {/* Discord-style "App Theme" Entry Banner */}
              <TouchableOpacity
                style={styles.appThemeEntryCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrentScreen('theme');
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={activeTheme.colors}
                  style={styles.appThemeSwatchPreview}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.appThemeEntryText}>
                  <Text style={styles.appThemeEntryTitle}>App Theme</Text>
                  <Text style={styles.appThemeEntrySub} numberOfLines={1}>
                    {activeTheme.name} • Customize Tone & Glow
                  </Text>
                </View>
                <View style={styles.appThemeBadge}>
                  <Text style={styles.appThemeBadgeText}>New</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>

              {/* Quick Horizontal Presets */}
              <View style={[styles.card, { marginTop: 12 }]}>
                <Text style={styles.subSectionTitle}>Quick Select</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
                  {GRADIENT_PRESETS.map((preset) => {
                    const isSelected = settings.gradientId === preset.id;
                    return (
                      <TouchableOpacity
                        key={preset.id}
                        style={[
                          styles.quickPill,
                          isSelected && [styles.quickPillActive, { borderColor: preset.accentColor }],
                        ]}
                        onPress={() => handleSelectGradient(preset.id)}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={preset.colors}
                          style={styles.quickPillGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        />
                        <Text
                          style={[styles.quickPillName, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}
                          numberOfLines={1}
                        >
                          {preset.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* LANGUAGE SECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>{t('languageSection')}</Text>
              <View style={styles.card}>
                <View style={styles.languageRow}>
                  {(
                    [
                      { id: 'en', label: 'English', flag: '🇬🇧' },
                      { id: 'fr', label: 'Français', flag: '🇫🇷' },
                      { id: 'ar', label: 'العربية', flag: '🇲🇦' },
                    ] as const
                  ).map((lang) => {
                    const isSelected = (settings.language || 'en') === lang.id;
                    return (
                      <TouchableOpacity
                        key={lang.id}
                        style={[styles.languagePill, isSelected && styles.languagePillActive]}
                        onPress={() => handleSelectLanguage(lang.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.languageFlag}>{lang.flag}</Text>
                        <Text
                          style={[
                            styles.languageText,
                            isSelected && styles.languageTextActive,
                          ]}
                        >
                          {lang.label}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#000000"
                            style={{ marginLeft: 4 }}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* CREDITS SECTION: DEVELOPED BY YSF */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>{t('creditsSection')}</Text>
              <LinearGradient
                colors={gradientColors}
                style={styles.creditsCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.creditsHeader}>
                  <View style={styles.creditsIconWrapper}>
                    <Ionicons name="code-slash" size={26} color="#FFFFFF" />
                  </View>
                  <View style={styles.creditsTextWrapper}>
                    <View style={styles.developerTitleRow}>
                      <Text style={styles.developedByTitle}>Developed By Ysf</Text>
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={styles.developerSubtitle}>{t('developerRole')}</Text>
                  </View>
                </View>

                <View style={styles.creditsDivider} />

                <View style={styles.creditsFooter}>
                  <Text style={styles.creditsTagline}>{t('craftsmanshipTag')}</Text>
                  <View style={styles.versionBadge}>
                    <Text style={styles.versionText}>{t('appVersion')}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        </View>
      )}
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  doneButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  doneButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
    paddingBottom: 60,
  },
  section: {
    marginBottom: THEME.spacing.xl,
  },
  sectionHeader: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: THEME.spacing.sm,
    marginLeft: 4,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 16,
  },
  pfpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  discordStatusDot: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#0A0A0C',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  pfpActions: {
    flex: 1,
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  actionPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  removePill: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removePillText: {
    color: THEME.colors.error,
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    marginTop: 4,
  },
  inputLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveNameButton: {
    backgroundColor: '#FFFFFF',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appThemeEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  appThemeSwatchPreview: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginRight: 14,
  },
  appThemeEntryText: {
    flex: 1,
  },
  appThemeEntryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  appThemeEntrySub: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  appThemeBadge: {
    backgroundColor: 'rgba(88, 101, 242, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#5865F2',
    marginRight: 8,
  },
  appThemeBadgeText: {
    color: '#8593FF',
    fontSize: 11,
    fontWeight: '700',
  },
  subSectionTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  quickScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  quickPill: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    width: 78,
  },
  quickPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  quickPillGradient: {
    width: 64,
    height: 38,
    borderRadius: 8,
    marginBottom: 6,
  },
  quickPillName: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  languagePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  languagePillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  languageFlag: {
    fontSize: 16,
    marginRight: 6,
  },
  languageText: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  languageTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  creditsCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  creditsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditsIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  creditsTextWrapper: {
    flex: 1,
  },
  developerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  developedByTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  developerSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  creditsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 14,
  },
  creditsFooter: {
    gap: 10,
  },
  creditsTagline: {
    color: THEME.colors.accentSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  versionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  versionText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
