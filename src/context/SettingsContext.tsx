import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserSettings, getUserSettings, saveUserSettings, DEFAULT_USER_SETTINGS } from '../services/storageService';
import { GRADIENT_PRESETS, ThemePreset } from '../constants/theme';
import { TRANSLATIONS, TranslationKey, Language } from '../constants/translations';

interface SettingsContextType {
  settings: UserSettings;
  activePreset: ThemePreset;
  activeTheme: ThemePreset;
  gradientColors: readonly [string, string, string];
  ambientGlow: string;
  accentColor: string;
  cardBackground: string;
  language: Language;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  updateName: (name: string) => Promise<void>;
  updatePfp: (pfpUri: string | null) => Promise<void>;
  updateGradient: (gradientId: string) => Promise<void>;
  updateLanguage: (lang: Language) => Promise<void>;
  settingsVisible: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [settingsVisible, setSettingsVisible] = useState(false);

  useEffect(() => {
    getUserSettings().then((loaded) => {
      setSettings(loaded);
    });
  }, []);

  const activePreset = useMemo(() => {
    return (
      GRADIENT_PRESETS.find((p) => p.id === settings.gradientId) ||
      GRADIENT_PRESETS[1] // Default to Obsidian Noir if not found
    );
  }, [settings.gradientId]);

  const gradientColors = activePreset.colors;
  const ambientGlow = activePreset.ambientGlow;
  const accentColor = activePreset.accentColor;
  const cardBackground = activePreset.cardBackground;

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const lang = settings.language || 'en';
      const langDict = TRANSLATIONS[lang] || TRANSLATIONS.en;
      let text = langDict[key] || TRANSLATIONS.en[key] || String(key);

      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
        });
      }

      return text;
    },
    [settings.language]
  );

  const updateName = useCallback(async (name: string) => {
    const updated = await saveUserSettings({ name });
    setSettings(updated);
  }, []);

  const updatePfp = useCallback(async (pfpUri: string | null) => {
    const updated = await saveUserSettings({ pfpUri });
    setSettings(updated);
  }, []);

  const updateGradient = useCallback(async (gradientId: string) => {
    const updated = await saveUserSettings({ gradientId });
    setSettings(updated);
  }, []);

  const updateLanguage = useCallback(async (language: Language) => {
    const updated = await saveUserSettings({ language });
    setSettings(updated);
  }, []);

  const openSettings = useCallback(() => setSettingsVisible(true), []);
  const closeSettings = useCallback(() => setSettingsVisible(false), []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        activePreset,
        activeTheme: activePreset,
        gradientColors,
        ambientGlow,
        accentColor,
        cardBackground,
        language: settings.language,
        t,
        updateName,
        updatePfp,
        updateGradient,
        updateLanguage,
        settingsVisible,
        openSettings,
        closeSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
