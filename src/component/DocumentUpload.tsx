import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RentAppColors, getRentThemeColors} from '../constants/colors';
import {useTheme} from '../contexts/ThemeContext';
import {ThemedText} from './ThemedText';
import {NODE_API_ENDPOINT} from '../constants';

interface DocumentUploadProps {
  tenantId: string;
  userToken: string;
  onUploadSuccess: () => void;
  onUploadError: (error: string) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  tenantId,
  userToken,
  onUploadSuccess,
  onUploadError,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const {isDark} = useTheme();
  const themeColors = getRentThemeColors(isDark);

  const openDocumentPicker = () => {
    Alert.alert('Document Upload', 'Choose how to add your document:', [
      {
        text: 'Photo from Gallery',
        onPress: () => pickImageFromGallery(),
      },
      {
        text: 'Take Photo',
        onPress: () => pickImageFromCamera(),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const pickImageFromGallery = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as const,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: false,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        console.log('Image picker cancelled or error:', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedFile({
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          uri: asset.uri || '',
        });
        setShowModal(true);
      }
    });
  };

  const pickImageFromCamera = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as const,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: false,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        console.log('Camera cancelled or error:', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedFile({
          name: asset.fileName || `camera_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
          uri: asset.uri || '',
        });
        setShowModal(true);
      }
    });
  };

  const uploadDocument = async () => {
    if (!selectedFile || !documentName.trim()) {
      Alert.alert('Error', 'Please select a file and enter a document name.');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('document', {
        uri: selectedFile.uri,
        type: selectedFile.type,
        name: selectedFile.name,
      } as any);
      formData.append('name', documentName.trim());

      const response = await fetch(
        `${NODE_API_ENDPOINT}/tenant/addDocument/${tenantId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${userToken}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log(errorData);
        throw new Error(
          errorData.message ||
            `HTTP ${response.status}: Failed to upload document`,
        );
      }

      const result = await response.json();
      console.log('Upload success:', result);

      Alert.alert(
        'Success',
        result.message || 'Document uploaded successfully! 🎉',
      );

      // Reset form
      setDocumentName('');
      setSelectedFile(null);
      setShowModal(false);

      onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);

      let errorMessage = 'Failed to upload document. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('400')) {
          errorMessage = 'No file selected or invalid file format.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Tenant not found. Please try again.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection.';
        }
      }

      onUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setDocumentName('');
    setSelectedFile(null);
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={openDocumentPicker}
        style={{
          backgroundColor: RentAppColors.primary[500],
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Icon name="plus" size={16} color="white" />
        <ThemedText weight="medium" style={{marginLeft: 4, color: 'white'}}>
          Add Document
        </ThemedText>
      </TouchableOpacity>

      {/* Upload Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={resetForm}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}>
          <View
            style={{
              backgroundColor: themeColors.surface,
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 400,
            }}>
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}>
              <ThemedText size="xl" weight="bold">
                Upload Document
              </ThemedText>
              <TouchableOpacity
                onPress={resetForm}
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: themeColors.surfaceVariant,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name="close" size={18} color={themeColors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Selected File Info */}
            {selectedFile && (
              <View
                style={{
                  backgroundColor: themeColors.surfaceVariant,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <Icon
                  name={
                    selectedFile.type?.startsWith('image/')
                      ? 'image'
                      : 'file-pdf-box'
                  }
                  size={24}
                  color={RentAppColors.primary[500]}
                />
                <View style={{marginLeft: 12, flex: 1}}>
                  <ThemedText size="sm" weight="medium" numberOfLines={1}>
                    {selectedFile.name}
                  </ThemedText>
                  <ThemedText variant="secondary" size="xs">
                    {selectedFile.type?.startsWith('image/') ? 'Image' : 'PDF'}
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Document Name Input */}
            <View style={{marginBottom: 20}}>
              <ThemedText size="sm" weight="medium" style={{marginBottom: 8}}>
                Document Name *
              </ThemedText>
              <TextInput
                style={{
                  backgroundColor: themeColors.surfaceVariant,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: themeColors.text.primary,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                }}
                placeholder="e.g., Aadhar Card, Passport, Contract"
                placeholderTextColor={themeColors.text.tertiary}
                value={documentName}
                onChangeText={setDocumentName}
                editable={!uploading}
              />
            </View>

            {/* Action Buttons */}
            <View style={{flexDirection: 'row', gap: 12}}>
              <TouchableOpacity
                onPress={resetForm}
                disabled={uploading}
                style={{
                  flex: 1,
                  backgroundColor: themeColors.surfaceVariant,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: uploading ? 0.6 : 1,
                }}>
                <ThemedText weight="semibold">Cancel</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={uploadDocument}
                disabled={uploading || !selectedFile || !documentName.trim()}
                style={{
                  flex: 1,
                  backgroundColor: RentAppColors.primary[500],
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  opacity:
                    uploading || !selectedFile || !documentName.trim()
                      ? 0.6
                      : 1,
                }}>
                {uploading ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <ThemedText
                      weight="semibold"
                      style={{marginLeft: 8, color: 'white'}}>
                      Uploading...
                    </ThemedText>
                  </>
                ) : (
                  <>
                    <Icon name="upload" size={18} color="white" />
                    <ThemedText
                      weight="semibold"
                      style={{marginLeft: 8, color: 'white'}}>
                      Upload
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default DocumentUpload;
