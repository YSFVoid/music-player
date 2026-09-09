# Plan - iPhone Music Player

> Roadmap complète du développement, phase par phase.

---

## Vision du Projet

Application de lecteur de musique iPhone **100% offline** avec:
- Téléchargement audio depuis YouTube (recherche par titre OU lien, style MP3Juice)
- Import de fichiers MP3/M4A depuis l'iPhone
- Interface **Apple Music Style** (Dark, Glassmorphism, dégradés dynamiques)
- Lecture en arrière-plan (Lock Screen, Centre de contrôle, Mode silencieux)
- Playlists, Favoris, Recherche locale
- Éditeur de tags (Titre, Artiste, Pochette depuis la Galerie)
- Statistiques d'écoute "Mon Replay"
- Téléchargement groupé (Batch Download)

---

## Features Validées

| # | Feature | Statut |
|---|---------|--------|
| 1 | Player 100% Offline | ✅ Validé |
| 2 | Téléchargement YouTube (Recherche + Lien) | ✅ Validé |
| 3 | Preview audio avant téléchargement | ✅ Validé |
| 4 | Batch Download (sélection multiple) | ✅ Validé |
| 5 | Import fichiers MP3 locaux (iCloud/Fichiers) | ✅ Validé |
| 6 | Lecture arrière-plan iOS (Lock Screen) | ✅ Validé |
| 7 | Playlists personnalisées | ✅ Validé |
| 8 | Favoris (Système de Likes) | ✅ Validé |
| 9 | Recherche locale dans la bibliothèque | ✅ Validé |
| 10 | Tag & Cover Editor | ✅ Validé |
| 11 | Mon Replay / Statistiques d'écoute | ✅ Validé |
| 12 | Apple Music Style (Glassmorphism, Blur, Dégradés) | ✅ Validé |
| 13 | Haptic Feedback iOS (Vibrations Taptic Engine) | ✅ Validé |
| 14 | Home avec sections (Récents, Favoris, Playlists) | ✅ Validé |

---

## Phases de Développement

### Phase 1 — Services & Fondations (Asass)
> Objectif: Tout le back-end local de l'app, invisible mais essentiel.

- [ ] src/services/fileManager.ts — Dossiers locaux audio/ et artwork/, copie, téléchargement, suppression
- [ ] src/services/storageService.ts — AsyncStorage: CRUD tracks, playlists, favoris, stats
- [ ] src/services/importService.ts — Import MP3 via expo-document-picker
- [ ] src/services/youtubeService.ts — Recherche + extraction audio + download MP3 depuis YouTube
- [ ] src/types/music.ts — Interfaces TypeScript *(déjà fait ✅)*
- [ ] src/constants/theme.ts — Thème Apple Music *(déjà fait ✅)*

---

### Phase 2 — Contexte Audio & Moteur de Lecture
> Objectif: Le coeur du lecteur, accessible depuis toute l'app.

- [ ] src/context/AudioContext.tsx — État global: currentTrack, isPlaying, queue, position, shuffle, repeat
- [ ] src/hooks/useAudio.ts — Hook React pour accéder au player depuis n'importe quel écran
- [ ] Configuration expo-av avec background iOS (playsInSilentModeIOS, staysActiveInBackground)
- [ ] Gestion de la file d'attente (queue): play, pause, next, prev, shuffle, repeat
- [ ] Suivi du temps d'écoute (pour les stats Mon Replay)

---

### Phase 3 — Écran Recherche & Téléchargement YouTube
> Objectif: L'écran MP3Juice de l'app.

- [ ] src/screens/SearchScreen.tsx
  - [ ] Barre de recherche (mots-clés OU coller un lien YouTube)
  - [ ] Affichage des résultats: pochette, titre, artiste, durée
  - [ ] Bouton Preview (écouter extrait)
  - [ ] Bouton Download individuel avec barre de progression
  - [ ] Mode sélection multiple + Batch Download
  - [ ] Toast de confirmation "Ajouté à ta bibliothèque ✅"
- [ ] src/components/SearchResultItem.tsx

---

### Phase 4 — Écran Bibliothèque & Import Local
> Objectif: Gérer toute la musique stockée sur l'iPhone.

- [ ] src/screens/LibraryScreen.tsx
  - [ ] Onglets: Tous | Favoris | Playlists | Téléchargés
  - [ ] Bouton "Importer des fichiers MP3" (expo-document-picker)
  - [ ] Barre de recherche locale (filtre en temps réel)
  - [ ] Liste des morceaux avec swipe actions ou menu 3 points
- [ ] src/components/TrackItem.tsx — Morceau avec Like, Edit Tags, Ajouter à playlist, Supprimer
- [ ] Modal création et gestion des Playlists
- [ ] src/components/PlaylistCard.tsx
- [ ] src/components/TagEditor.tsx — Modal: Titre, Artiste, Pochette (galerie iPhone)

---

### Phase 5 — Écran Home (Accueil Apple Music)
> Objectif: La première chose que voit l'utilisateur.

- [ ] src/screens/HomeScreen.tsx
  - [ ] Header avec salutation (Bonjour/Bonsoir)
  - [ ] Carte "Mon Replay": heures d'écoute + top morceaux
  - [ ] Section "Écoutés récemment" (carrousel horizontal)
  - [ ] Section "Coups de coeur" (Favoris)
  - [ ] Playlists à la une
  - [ ] Boutons rapides: Télécharger YouTube / Importer MP3

---

### Phase 6 — Lecteur Apple Music (Mini-Player + Plein Écran)
> Objectif: L'expérience visuelle signature de l'app.

- [ ] src/components/MiniPlayer.tsx
  - [ ] BlurView (verre dépoli iOS) en bas de chaque écran
  - [ ] Pochette miniature, titre, artiste
  - [ ] Play/Pause + barre de progression fine
  - [ ] Tap pour ouvrir le lecteur plein écran
- [ ] src/components/FullPlayer.tsx
  - [ ] Pochette grande avec animation (s'agrandit en lecture)
  - [ ] Arrière-plan avec dégradé dynamique basé sur la pochette
  - [ ] Timeline interactive (slider) avec temps écoulé / restant
  - [ ] Contrôles: Précédent, Play/Pause, Suivant
  - [ ] Boutons: Shuffle, Repeat, Like (Coeur), File d'attente
  - [ ] Haptic feedback sur chaque action

---

### Phase 7 — Navigation Principale & Intégration Finale
> Objectif: Relier tous les écrans et polir l'app.

- [ ] App.tsx — Navigation à onglets (Home, Recherche, Bibliothèque)
  - [ ] Tab Bar glassmorphism (BlurView)
  - [ ] MiniPlayer persistant au-dessus de la Tab Bar
- [ ] Vérification de toutes les transitions et animations
- [ ] Test final complet sur iPhone via Expo Go

---

## Ordre de Développement

`
Phase 1 (Services) → Phase 2 (Audio Engine) → Phase 3 (Search/YouTube)
→ Phase 4 (Library) → Phase 5 (Home) → Phase 6 (Player) → Phase 7 (Nav)
`

Chaque phase produit un résultat testable sur iPhone avant de passer à la suivante.

---

## Dépendances Installées

- [x] expo (~57.0.21)
- [x] expo-av (^16.0.8)
- [x] expo-blur (~57.0.2)
- [x] expo-document-picker (~57.0.1)
- [x] expo-file-system (~18.0.4)
- [x] expo-haptics
- [x] expo-image-picker
- [x] expo-linear-gradient (~57.0.1)
- [x] expo-status-bar (~57.0.1)
- [x] @expo/vector-icons (^15.0.2)
- [x] @react-native-async-storage/async-storage (2.2.0)
- [x] @react-native-community/slider (5.2.0)
- [x] react-native-safe-area-context (~5.7.0)
