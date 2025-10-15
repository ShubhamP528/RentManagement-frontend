import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  StatusBar,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Pdf from 'react-native-pdf';
import ImageViewing from 'react-native-image-viewing';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RentAppColors, getRentThemeColors} from '../constants/colors';
import {useTheme} from '../contexts/ThemeContext';
import {ThemedText} from './ThemedText';

interface Document {
  _id: string;
  url: string;
  fileType: string;
  name: string;
}

interface DocumentViewerProps {
  document: Document | null;
  visible: boolean;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  visible,
  onClose,
}) => {
  const {isDark} = useTheme();
  const themeColors = getRentThemeColors(isDark);

  // Always call hooks at the top level
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfPages, setPdfPages] = useState(0);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Reset PDF state when document changes
  useEffect(() => {
    if (document && document.fileType === 'application/pdf') {
      setPdfLoading(true);
      setPdfPages(0);
      setPdfCurrentPage(1);
      setPdfError(null);
    }
  }, [document]);

  // PDF event handlers - always defined
  const handlePdfLoadComplete = useCallback((numberOfPages: number) => {
    setPdfPages(numberOfPages);
    setPdfLoading(false);
  }, []);

  const handlePdfPageChanged = useCallback((page: number) => {
    setPdfCurrentPage(page);
  }, []);

  const handlePdfError = useCallback((error: any) => {
    console.log(error.message, 'no');
    setPdfError(error.message || 'Failed to load PDF');
    setPdfLoading(false);
  }, []);

  // Early return after all hooks
  if (!document) return null;

  const isImage = document.fileType.startsWith('image/');
  const isPDF = document.fileType === 'application/pdf';

  return (
    <>
      {isImage && (
        <ImageViewing
          images={[{uri: document.url}]}
          imageIndex={0}
          visible={visible}
          onRequestClose={onClose}
        />
      )}

      {!isImage && (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
          <View
            style={[
              styles.container,
              {backgroundColor: themeColors.background},
            ]}>
            <View
              style={[styles.header, {backgroundColor: themeColors.surface}]}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Icon
                  name="arrow-left"
                  size={24}
                  color={themeColors.text.primary}
                />
              </TouchableOpacity>
              <ThemedText size="lg" weight="semibold">
                {document.name}
              </ThemedText>
            </View>

            <View style={styles.content}>
              {isPDF ? (
                pdfError ? (
                  <View style={styles.errorContainer}>
                    <Icon
                      name="file-pdf-box"
                      size={64}
                      color={RentAppColors.status.error}
                    />
                    <ThemedText style={{marginTop: 16, textAlign: 'center'}}>
                      {pdfError}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(document.url)}
                      style={[
                        styles.button,
                        {backgroundColor: RentAppColors.primary[500]},
                      ]}>
                      <ThemedText style={{color: 'white'}}>
                        Open Externally
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Pdf
                      source={{
                        uri: document.url,
                        cache: true,
                        expiration: 24 * 60 * 60 * 1000, // 24 hours
                      }}
                      onLoadComplete={handlePdfLoadComplete}
                      onPageChanged={handlePdfPageChanged}
                      onError={handlePdfError}
                      style={styles.pdf}
                      trustAllCerts={true}
                      enablePaging={true}
                      spacing={10}
                      horizontal={false}
                      renderActivityIndicator={() => (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator
                            size="large"
                            color={RentAppColors.status.error}
                          />
                          <ThemedText
                            style={{marginTop: 16, textAlign: 'center'}}>
                            Loading PDF...
                          </ThemedText>
                        </View>
                      )}
                    />
                    {pdfPages > 0 && (
                      <View
                        style={[
                          styles.pageInfo,
                          {backgroundColor: themeColors.surface},
                        ]}>
                        <ThemedText>
                          Page {pdfCurrentPage} of {pdfPages}
                        </ThemedText>
                      </View>
                    )}
                  </>
                )
              ) : (
                <View style={styles.errorContainer}>
                  <Icon
                    name="file-document"
                    size={64}
                    color={RentAppColors.primary[500]}
                  />
                  <ThemedText style={{marginTop: 16, textAlign: 'center'}}>
                    {document.name}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(document.url)}
                    style={[
                      styles.button,
                      {backgroundColor: RentAppColors.primary[500]},
                    ]}>
                    <ThemedText style={{color: 'white'}}>
                      Open Document
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  content: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
  },
  pageInfo: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
});

export default DocumentViewer;
