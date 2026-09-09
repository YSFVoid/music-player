# Workflow - iPhone Music Player

> Document de référence technique pour comprendre comment chaque partie de l'application fonctionne ensemble.

---

## 1. Stack Technique

| Couche | Technologie | Rôle |
| :--- | :--- | :--- |
| **Framework** | React Native + Expo SDK 57 | Base de l'app iOS |
| **Langage** | TypeScript | Code propre et typé, zéro erreurs de types |
| **UI / Design** | expo-blur, expo-linear-gradient, @expo/vector-icons (Ionicons) | Apple Music glassmorphism style |
| **Retours haptiques** | expo-haptics | Vibrations douces iOS (Taptic Engine) au tap/like |
| **Audio** | expo-av | Moteur de lecture, timeline, arrière-plan iOS |
| **Stockage fichiers** | expo-file-system | Persistance locale des MP3 et pochettes |
| **Base de données locale** | @react-native-async-storage/async-storage | Métadonnées, playlists, favoris, stats |
| **Import fichiers** | expo-document-picker | Ouvrir app Fichiers iPhone pour importer MP3 |
| **Galerie photo** | expo-image-picker | Choisir une photo comme pochette personnalisée |
| **Navigation** | Système d'onglets React Native | Home, Recherche, Bibliothèque |

---

## 2. Architecture des Services (src/services/)

```
services/
├── fileManager.ts       → Gestion des dossiers audio/ et artwork/ locaux
├── storageService.ts    → CRUD AsyncStorage: tracks, playlists, favoris, stats
├── audioService.ts      → Moteur expo-av: play/pause/seek/queue/background
├── youtubeService.ts    → Recherche YouTube + extraction flux audio + téléchargement
└── importService.ts     → Import MP3 local (DocumentPicker) + copie dans app storage
```

---

## 3. Flux de données - Téléchargement YouTube (MP3Juice Style)

```
[User] tape titre OU colle un lien YouTube
         │
         ▼
[youtubeService.search()] ──► Requête vers Piped/Invidious (proxy YouTube public)
         │
         ▼
[Résultats affichés] ── Titre | Durée | Chaîne | Thumbnail
         │
    ┌────┴────┐
    │         │
  Preview   Download
    │         │
    ▼         ▼
[Stream]  [expo-file-system.downloadAsync()]
  direct        │
                ▼
            audio/[timestamp]_titre.mp3  ← stocké localement
            artwork/[timestamp]_cover.jpg ← pochette sauvée
                  │
                  ▼
            [storageService.saveTrack()] ← métadonnées en AsyncStorage
                  │
                  ▼
            ✅ Visible dans Bibliothèque & Home (Téléchargements récents)
            ✅ 100% Offline désormais
```

---

## 4. Flux de données - Import MP3 Local

```
[User] tap bouton "Importer des fichiers"
         │
         ▼
[expo-document-picker] ── Ouvre app Fichiers d'iOS
         │
         ▼
[User choisit fichiers .mp3 / .m4a / .wav]
         │
         ▼
[importService.importFiles()] ──► fileManager.copyToAppStorage()
         │
         ▼
[storageService.saveTrack()] ── Sauvegardé en AsyncStorage
         │
         ▼
✅ Disponible dans Bibliothèque & 100% Offline
```

---

## 5. Moteur Audio & Arrière-Plan iOS

```
app.json:
  "UIBackgroundModes": ["audio"]          ← Active l'audio en arrière-plan

expo-av configuration:
  playsInSilentModeIOS: true              ← Fonctionne en mode silencieux
  staysActiveInBackground: true           ← Continue quand iPhone verrouillé

Résultat:
  ✅ Lecture quand iPhone est verrouillé (Lock Screen)
  ✅ Contrôles sur l'écran de verrouillage (pochette + play/pause/next)
  ✅ Contrôle depuis le Centre de contrôle iOS
  ✅ Fonctionne en mode silencieux / vibreur
  ✅ Continue pendant WhatsApp, Safari, Instagram...
```

---

## 6. Stockage Local (AsyncStorage Keys)

```
@tracks           → Track[]         (tous les morceaux téléchargés/importés)
@playlists        → Playlist[]      (playlists créées par l'utilisateur)
@listening_stats  → ListeningStats  (total heures, compteurs de lecture)
```

---

## 7. Workflow Développement & Test iPhone

```
[ Windows PC ]                         [ iPhone ]
      │  npx expo start                     │
      │ ──────────────►  QR Code affiché    │  Expo Go (App Store)
      │                                     │  Scanner le QR Code
      │ ◄────────── Même réseau Wi-Fi ─────►│
      │  Modifier code                      │  App se rafraîchit en 1s
```

> Prérequis: PC et iPhone sur le même réseau Wi-Fi.

---

## 8. Arborescence du Projet

```
Music Player/
├── app.json                    ← Config Expo (iOS background audio)
├── App.tsx                     ← Point d'entrée: navigation + providers
├── workflow.md                 ← Ce fichier
├── plan.md                     ← Plan de développement
└── src/
    ├── types/music.ts          ← Interfaces TypeScript
    ├── constants/theme.ts      ← Couleurs Apple Music style
    ├── services/
    │   ├── fileManager.ts
    │   ├── storageService.ts
    │   ├── audioService.ts
    │   ├── youtubeService.ts
    │   └── importService.ts
    ├── context/AudioContext.tsx ← État global de lecture
    ├── hooks/useAudio.ts
    ├── screens/
    │   ├── HomeScreen.tsx
    │   ├── SearchScreen.tsx
    │   └── LibraryScreen.tsx
    └── components/
        ├── MiniPlayer.tsx
        ├── FullPlayer.tsx
        ├── TrackItem.tsx
        ├── PlaylistCard.tsx
        ├── TagEditor.tsx
        └── SearchResultItem.tsx
```
