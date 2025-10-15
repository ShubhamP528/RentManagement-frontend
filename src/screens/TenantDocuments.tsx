import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../stacks/Home';
import {NODE_API_ENDPOINT} from '../constants';
import {useSelector} from 'react-redux';
import {RootState} from '../redux/store';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomHeader from '../component/CustomHeader';
import DocumentUpload from '../component/DocumentUpload';
import DocumentViewer from '../component/DocumentViewer';
import {RentAppColors, getRentThemeColors} from '../constants/colors';
import {useTheme} from '../contexts/ThemeContext';
import {ThemedText} from '../component/ThemedText';

interface Document {
  _id: string;
  url: string;
  public_id: string;
  fileType: string;
  name: string;
  uploadedAt: string;
}

interface Tenant {
  _id: string;
  name: string;
  documents: Document[];
}

type TenantDocumentsProps = NativeStackScreenProps<
  RootStackParamList,
  'TenantDocuments'
>;

const TenantDocuments = ({route, navigation}: TenantDocumentsProps) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const {isDark} = useTheme();
  const themeColors = getRentThemeColors(isDark);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const {tenantId} = route.params;

  // Hide default header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const fetchTenantDocuments = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoading(true);
        const response = await fetch(
          `${NODE_API_ENDPOINT}/tenant/getAllDocuments/${tenantId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentUser?.token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }

        const data = await response.json();
        console.log('Documents API response:', data);

        // Handle the API response structure based on your API spec
        if (data.documents && Array.isArray(data.documents)) {
          // API returns documents directly in 'documents' array
          setTenant({
            _id: tenantId,
            name: 'Tenant', // You might want to fetch tenant name separately
            documents: data.documents,
          });
        } else {
          // No documents found or different structure
          setTenant({
            _id: tenantId,
            name: 'Tenant',
            documents: [],
          });
        }
        setLoading(false);
        setRefreshing(false);
      } catch (error) {
        setLoading(false);
        setRefreshing(false);

        console.error('Error fetching documents:', error);

        // Show empty state when API fails
        setTenant({
          _id: tenantId,
          name: 'Tenant',
          documents: [],
        });

        // Show user-friendly error message
        Alert.alert(
          'Error',
          'Failed to fetch documents. Please check your connection and try again.',
          [
            {
              text: 'Retry',
              onPress: () => fetchTenantDocuments(),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ],
        );
      }
    },
    [currentUser?.token, tenantId],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTenantDocuments(true);
  }, [fetchTenantDocuments]);

  useEffect(() => {
    if (currentUser) {
      fetchTenantDocuments();
    }
  }, [currentUser, fetchTenantDocuments]);

  const handleUploadSuccess = () => {
    fetchTenantDocuments();
  };

  const handleUploadError = (error: string) => {
    Alert.alert('Upload Error', error);
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

  const handleDeleteDocument = (documentId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDocument(documentId),
        },
      ],
    );
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(
        `${NODE_API_ENDPOINT}/tenant/deleteDocument/${tenantId}/${documentId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser?.token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      Alert.alert('Success', 'Document deleted successfully');
      fetchTenantDocuments();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete document. Please try again.');
      console.error('Error:', error);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return 'image';
    } else if (fileType === 'application/pdf') {
      return 'file-pdf-box';
    }
    return 'file-document';
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return RentAppColors.status.success;
    } else if (fileType === 'application/pdf') {
      return RentAppColors.status.error;
    }
    return RentAppColors.primary[500];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderDocument = ({item}: {item: Document}) => (
    <View
      style={{
        backgroundColor: themeColors.surface,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#494949',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
          <View
            style={{
              width: 48,
              height: 48,
              backgroundColor: getFileTypeColor(item.fileType) + '20',
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
            <Icon
              name={getFileIcon(item.fileType)}
              size={24}
              color={getFileTypeColor(item.fileType)}
            />
          </View>
          <View style={{flex: 1}}>
            <ThemedText size="base" weight="semibold" numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedText variant="secondary" size="sm">
              {formatDate(item.uploadedAt)}
            </ThemedText>
            <ThemedText variant="tertiary" size="xs">
              {item.fileType.startsWith('image/') ? 'Image' : 'PDF Document'}
            </ThemedText>
          </View>
        </View>

        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <TouchableOpacity
            onPress={() => handleViewDocument(item)}
            style={{
              width: 40,
              height: 40,
              backgroundColor: RentAppColors.primary[100],
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon name="eye" size={18} color={RentAppColors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteDocument(item._id)}
            style={{
              width: 40,
              height: 40,
              backgroundColor: RentAppColors.status.error + '20',
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon name="delete" size={18} color={RentAppColors.status.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: themeColors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <ActivityIndicator size="large" color={RentAppColors.primary[500]} />
        <ThemedText
          variant="secondary"
          style={{marginTop: 16, textAlign: 'center'}}>
          Loading documents...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: themeColors.background}}>
      <CustomHeader
        title={`${tenant?.name || 'Tenant'} Documents`}
        subtitle="Managing"
      />

      {/* Statistics Section */}
      <View
        style={{
          backgroundColor: themeColors.surface,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border,
          padding: 16,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View>
            <ThemedText size="2xl" weight="bold">
              Documents
            </ThemedText>
            <ThemedText variant="secondary">
              {tenant?.documents?.length || 0} files uploaded
            </ThemedText>
          </View>
          <DocumentUpload
            tenantId={tenantId}
            userToken={currentUser?.token || ''}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </View>
      </View>

      {/* Documents List */}
      {!tenant?.documents || tenant.documents.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}>
          <View
            style={{
              width: 96,
              height: 96,
              backgroundColor: themeColors.surfaceVariant,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}>
            <Icon
              name="file-document-outline"
              size={40}
              color={themeColors.text.tertiary}
            />
          </View>
          <ThemedText
            size="xl"
            weight="semibold"
            style={{marginBottom: 8, textAlign: 'center'}}>
            No Documents Yet
          </ThemedText>
          <ThemedText
            variant="secondary"
            style={{textAlign: 'center', marginBottom: 32, lineHeight: 24}}>
            Upload documents like ID cards, contracts, or other important files
            for this tenant.
          </ThemedText>
          <DocumentUpload
            tenantId={tenantId}
            userToken={currentUser?.token || ''}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </View>
      ) : (
        <FlatList
          data={tenant.documents}
          renderItem={renderDocument}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingTop: 16, paddingBottom: 100}}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[RentAppColors.primary[500]]}
              tintColor={RentAppColors.primary[500]}
            />
          }
        />
      )}

      {/* Document Viewer */}
      <DocumentViewer
        document={selectedDocument}
        visible={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
      />
    </View>
  );
};

export default TenantDocuments;
