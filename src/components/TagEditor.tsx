import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { THEME } from '../constants/theme';
import { Track } from '../types/music';

interface TagEditorProps {
  visible: boolean;
  track: Track | null;
  onSave: (updates: { title: string; artist: string; artworkUri?: string }) => void;
  onClose: () => void;
}

export const TagEditor: React.FC<TagEditorProps> = ({
  visible,
  track,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [artworkUri, setArtworkUri] = useState<string | undefined>();

  useEffect(() => {
    if (track) {
      setTitle(track.title);
      setArtist(track.artist || '');
      setArtworkUri(track.artworkUri || track.artwork);
    }
  }, [track]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setArtworkUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    onSave({ title, artist, artworkUri });
    onClose();
  };

  if (!track) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.headerTitle}>Edit Track Info</Text>
          
          <TouchableOpacity style={styles.artworkContainer} onPress={handlePickImage}>
            {artworkUri ? (
              <Image source={{ uri: artworkUri }} style={styles.artwork} />
            ) : (
              <View style={[styles.artwork, styles.artworkPlaceholder]}>
                <Ionicons name="musical-notes" size={40} color={THEME.colors.textSecondary} />
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={24} color={THEME.colors.textPrimary} />
            </View>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={THEME.colors.textTertiary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Artist</Text>
            <TextInput
              style={styles.input}
              value={artist}
              onChangeText={setArtist}
              placeholderTextColor={THEME.colors.textTertiary}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  card: {
    backgroundColor: 'rgba(22, 22, 28, 0.95)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    padding: THEME.spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
    letterSpacing: -0.3,
  },
  artworkContainer: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    marginBottom: THEME.spacing.lg,
    position: 'relative',
  },
  artwork: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  artworkPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: 'rgba(40, 40, 48, 0.95)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  inputContainer: {
    marginBottom: THEME.spacing.md,
  },
  label: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 12,
    color: THEME.colors.textPrimary,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: THEME.spacing.md,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: THEME.spacing.xs,
  },
  cancelButtonText: {
    color: THEME.colors.textSecondary,
    fontSize: 15,
  },
});
