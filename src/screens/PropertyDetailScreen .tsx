import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RootStackParamList} from '../stacks/Home';
import {NODE_API_ENDPOINT} from '../constants';
import {useSelector} from 'react-redux';
import {RootState} from '../redux/store';
import {useFocusEffect} from '@react-navigation/native';
import CustomHeader from '../component/CustomHeader';
import {RentAppColors, getRentThemeColors} from '../constants/colors';
import {useTheme} from '../contexts/ThemeContext';
import {ThemedText} from '../component/ThemedText';
import {createThemedStyles} from '../styles/theme';

interface Address {
  pincode: string;
  locality: string;
  address: string;
  city: string;
  state: string;
  landmark: string;
}

interface Tenant {
  headPerson: {
    name: string;
    email: string;
    gender: string;
    dob: string;
  };
  startDate: string;
  endDate: string | null;
  Rent: number;
  PendingMoney: number;
}

export interface Room {
  _id: string;
  name: string;
  tenant: Tenant[];
}

export interface Property {
  _id: string;
  name: string;
  address: Address;
  rooms: Room[];
}

type PropertyDetailProps = NativeStackScreenProps<
  RootStackParamList,
  'PropertyDetail'
>;

const PropertyDetailScreen = ({route, navigation}: PropertyDetailProps) => {
  const {propertyId} = route.params;
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [focusedField, setFocusedField] = useState(false);

  const {isDark} = useTheme();
  const themeColors = getRentThemeColors(isDark);
  const styles = createThemedStyles(isDark);

  // Hide default header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const animationStarted = useRef(false);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const response = await fetch(
          `${NODE_API_ENDPOINT}/properties/get-property/${propertyId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentUser?.token}`,
            },
          },
        );
        if (!response.ok) {
          throw new Error('Failed to fetch property details');
        }
        const data = await response.json();
        console.log(data);
        setProperty(data);
      } catch (error) {
        console.error('Error fetching property details', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.token) {
      fetchPropertyDetails();
    }

    if (!animationStarted.current) {
      animationStarted.current = true;
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentUser?.token, propertyId, fadeAnim]);

  const fetchPropertyDetails = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      try {
        const response = await fetch(
          `${NODE_API_ENDPOINT}/properties/get-property/${propertyId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentUser?.token}`,
            },
          },
        );
        if (!response.ok) {
          throw new Error('Failed to fetch property details');
        }
        const data = await response.json();
        setProperty(data);
      } catch (error) {
        console.error('Error fetching property details', error);
        Alert.alert(
          'Error',
          'Failed to load property details. Please try again.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [propertyId, currentUser?.token],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPropertyDetails(true);
  }, [fetchPropertyDetails]);

  // / Re-fetch property details when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (currentUser?.token) {
        fetchPropertyDetails();
      }
    }, [fetchPropertyDetails, currentUser?.token]),
  );

  // Create a new room
  const handleAddRoom = async () => {
    if (!newRoomName.trim()) {
      setErrorMessage('Room name cannot be empty');
      return;
    }

    setLoadingAdd(true);
    setErrorMessage('');

    try {
      const response = await fetch(
        `${NODE_API_ENDPOINT}/room/addroom/${propertyId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser?.token}`,
          },
          body: JSON.stringify({roomName: newRoomName}),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to add new room');
      }

      const newRoom = await response.json();
      setProperty(
        prev => prev && {...prev, rooms: [...prev.rooms, newRoom.room]},
      );

      Alert.alert('Success', 'Room added successfully! 🎉');
      closeModal();
    } catch (error) {
      console.error('Error adding room:', error);
      setErrorMessage('Failed to add room. Please try again.');
    } finally {
      setLoadingAdd(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setErrorMessage('');
    setNewRoomName('');
    setFocusedField(false);
  };

  // Get room statistics
  const getRoomStats = () => {
    if (!property?.rooms) return {total: 0, occupied: 0, vacant: 0};

    const total = property.rooms.length;
    const occupied = property.rooms.filter(
      room =>
        room.tenant &&
        room.tenant.length > 0 &&
        room.tenant[room.tenant.length - 1]?.endDate === null,
    ).length;
    const vacant = total - occupied;

    return {total, occupied, vacant};
  };

  const stats = getRoomStats();

  // Enhanced room item rendering
  const renderRoomItem = ({item: room, index}: {item: Room; index: number}) => {
    const isOccupied =
      room.tenant &&
      room.tenant.length > 0 &&
      room.tenant[room.tenant.length - 1]?.endDate === null;
    const currentTenant = isOccupied
      ? room.tenant[room.tenant.length - 1]
      : null;

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim,
            },
            {
              scale: scaleAnim,
            },
          ],
        }}>
        <TouchableOpacity
          style={{
            backgroundColor: themeColors.surface,
            borderRadius: 16,
            marginHorizontal: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
          activeOpacity={0.8}
          onPress={() =>
            navigation.push('RoomDetail', {
              roomId: room._id,
            })
          }>
          <View className="p-5">
            {/* Room Header */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16,
                      backgroundColor: isOccupied
                        ? isDark
                          ? RentAppColors.status.success + '30'
                          : RentAppColors.status.success + '20'
                        : themeColors.surfaceVariant,
                    }}>
                    <Icon
                      name={isOccupied ? 'account-check' : 'door-open'}
                      size={26}
                      color={isOccupied ? '#10B981' : '#6B7280'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: themeColors.text.primary,
                        marginBottom: 4,
                      }}>
                      {room.name}
                    </Text>
                    <Text
                      style={{
                        color: themeColors.text.secondary,
                        fontSize: 14,
                      }}>
                      Room #{index + 1}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </View>

              <View
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isOccupied
                    ? isDark
                      ? RentAppColors.status.success + '30'
                      : RentAppColors.status.success + '20'
                    : isDark
                    ? RentAppColors.status.error + '30'
                    : RentAppColors.status.error + '20',
                }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: isOccupied
                      ? RentAppColors.status.success
                      : RentAppColors.status.error,
                  }}>
                  {isOccupied ? 'Occupied' : 'Vacant'}
                </Text>
              </View>
            </View>

            {/* Tenant Information */}
            {isOccupied && currentTenant && (
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: themeColors.border,
                  paddingTop: 16,
                }}>
                <View className="flex-row items-center mb-2">
                  <Icon name="account" size={16} color="#6B7280" />
                  <Text
                    style={{
                      color: themeColors.text.secondary,
                      marginLeft: 8,
                      fontWeight: '500',
                    }}>
                    {currentTenant.headPerson?.name || 'Tenant Name'}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Icon name="currency-inr" size={16} color="#6B7280" />
                    <Text
                      style={{
                        color: themeColors.text.secondary,
                        marginLeft: 4,
                        fontSize: 14,
                      }}>
                      ₹{currentTenant.Rent || 0}/month
                    </Text>
                  </View>
                  {(currentTenant.PendingMoney || 0) > 0 && (
                    <View className="flex-row items-center">
                      <Icon name="alert-circle" size={16} color="#EF4444" />
                      <Text
                        style={{
                          color: RentAppColors.status.error,
                          marginLeft: 4,
                          fontSize: 14,
                          fontWeight: '500',
                        }}>
                        ₹{currentTenant.PendingMoney || 0} pending
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Empty Room Message */}
            {!isOccupied && (
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: themeColors.border,
                  paddingTop: 16,
                }}>
                <View className="flex-row items-center">
                  <Icon
                    name="home-plus"
                    size={16}
                    color={themeColors.text.tertiary}
                  />
                  <Text
                    style={{
                      color: themeColors.text.tertiary,
                      marginLeft: 8,
                      fontSize: 14,
                    }}>
                    Available for rent
                  </Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: themeColors.background,
        }}>
        <View className="items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text
            style={{
              color: themeColors.text.secondary,
              marginTop: 16,
              fontSize: 16,
            }}>
            Loading property details...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: themeColors.background}}>
      <CustomHeader title="Property Details" subtitle="Viewing" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }>
        {/* Property Header */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
            backgroundColor: themeColors.surface,
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 16,
            shadowColor: RentAppColors.primary[900],
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}>
          <View className="p-6">
            {/* Property Title */}
            <View className="items-center mb-6">
              <View
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: isDark
                    ? RentAppColors.primary[900] + '40'
                    : RentAppColors.primary[100],
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}>
                <Icon name="home-variant" size={36} color="#3B82F6" />
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: themeColors.text.primary,
                  marginBottom: 8,
                  textAlign: 'center',
                }}>
                {property?.name}
              </Text>
              <Text
                style={{
                  color: themeColors.text.secondary,
                  textAlign: 'center',
                }}>
                Property Management Dashboard
              </Text>
            </View>

            {/* Address Section */}
            <View
              className="mb-6  rounded-xl p-4"
              style={{backgroundColor: themeColors.background}}>
              <View className="flex-row items-center mb-3">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: themeColors.surfaceVariant,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Icon name="map-marker" size={18} color="#6B7280" />
                </View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: themeColors.text.primary,
                  }}>
                  Location
                </Text>
              </View>
              <Text
                style={{
                  color: themeColors.text.secondary,
                  lineHeight: 24,
                  fontSize: 16,
                }}>
                {property?.address.address}
                {property?.address.locality &&
                  `, ${property?.address.locality}`}
                {'\n'}
                {property?.address.city}, {property?.address.state} -{' '}
                {property?.address.pincode}
              </Text>
              {property?.address.landmark && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: themeColors.border,
                  }}>
                  <Icon name="map-marker-star" size={16} color="#6B7280" />
                  <Text
                    style={{
                      color: themeColors.text.tertiary,
                      marginLeft: 8,
                      fontSize: 14,
                    }}>
                    Near {property.address.landmark}
                  </Text>
                </View>
              )}
            </View>

            {/* Statistics Cards - Responsive Layout */}
            <View>
              {/* First Row - Total Rooms (Full Width) */}
              <View
                style={{
                  backgroundColor: isDark
                    ? RentAppColors.primary[900] + '40'
                    : RentAppColors.primary[100],
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 12,
                }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <ThemedText
                      size="3xl"
                      weight="bold"
                      style={{
                        color: RentAppColors.primary[600],
                        marginBottom: 4,
                      }}>
                      {stats.total}
                    </ThemedText>
                    <ThemedText
                      size="base"
                      weight="semibold"
                      style={{color: RentAppColors.primary[600]}}>
                      Total Rooms
                    </ThemedText>
                  </View>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      backgroundColor: isDark
                        ? RentAppColors.primary[800]
                        : RentAppColors.primary[100],
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Icon name="door" size={28} color="#3B82F6" />
                  </View>
                </View>
              </View>

              {/* Second Row - Occupied and Vacant */}
              <View className="flex-row" style={{gap: 12}}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: isDark
                      ? RentAppColors.status.success + '30'
                      : RentAppColors.status.success + '20',
                    borderRadius: 12,
                    padding: 20,
                  }}>
                  <View className="items-center">
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        backgroundColor: isDark
                          ? RentAppColors.status.success + '40'
                          : RentAppColors.status.success + '30',
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                      }}>
                      <Icon name="account-check" size={24} color="#10B981" />
                    </View>
                    <ThemedText
                      size="2xl"
                      weight="bold"
                      style={{
                        color: RentAppColors.status.success,
                        marginBottom: 4,
                      }}>
                      {stats.occupied}
                    </ThemedText>
                    <ThemedText
                      size="sm"
                      weight="semibold"
                      style={{
                        color: RentAppColors.status.success,
                        textAlign: 'center',
                      }}>
                      Occupied
                    </ThemedText>
                  </View>
                </View>

                <View
                  style={{
                    flex: 1,
                    backgroundColor: isDark
                      ? RentAppColors.status.error + '30'
                      : RentAppColors.status.error + '20',
                    borderRadius: 12,
                    padding: 20,
                  }}>
                  <View className="items-center">
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        backgroundColor: isDark
                          ? RentAppColors.status.error + '40'
                          : RentAppColors.status.error + '30',
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                      }}>
                      <Icon name="door-open" size={24} color="#EF4444" />
                    </View>
                    <ThemedText
                      size="2xl"
                      weight="bold"
                      style={{
                        color: RentAppColors.status.error,
                        marginBottom: 4,
                      }}>
                      {stats.vacant}
                    </ThemedText>
                    <ThemedText
                      size="sm"
                      weight="semibold"
                      style={{
                        color: RentAppColors.status.error,
                        textAlign: 'center',
                      }}>
                      Vacant
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Rooms Section */}
        {property?.rooms && property.rooms.length > 0 ? (
          <View className="mt-6">
            <View className="flex-row items-center justify-between px-6 mb-4">
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: themeColors.text.primary,
                }}>
                Rooms ({property.rooms.length})
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="bg-blue-500 px-4 py-2 rounded-xl flex-row items-center">
                <Icon name="plus" size={16} color="white" />
                <ThemedText
                  weight="medium"
                  style={{marginLeft: 4, color: '#FFFFFF'}}>
                  Add Room
                </ThemedText>
              </TouchableOpacity>
            </View>

            <FlatList
              data={property.rooms}
              keyExtractor={item => item._id}
              renderItem={renderRoomItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ) : (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}],
            }}
            className="flex-1 items-center justify-center px-8 py-16">
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
              <Icon name="door-open" size={40} color="#9CA3AF" />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: themeColors.text.primary,
                marginBottom: 8,
                textAlign: 'center',
              }}>
              No Rooms Yet
            </Text>
            <Text
              style={{
                color: themeColors.text.secondary,
                textAlign: 'center',
                marginBottom: 32,
                lineHeight: 24,
              }}>
              Start by adding your first room to this property. You can manage
              tenants and track rent once rooms are added.
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="bg-blue-500 px-6 py-3 rounded-xl flex-row items-center">
              <Icon name="plus" size={20} color="white" />
              <ThemedText
                weight="semibold"
                style={{marginLeft: 8, color: '#FFFFFF'}}>
                Add First Room
              </ThemedText>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Bottom Padding */}
        <View className="h-20" />
      </ScrollView>

      {/* Floating Action Button */}
      {property?.rooms && property.rooms.length > 0 && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 bg-blue-500 w-16 h-16 rounded-full items-center justify-center shadow-lg"
          style={{
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}>
          <Icon name="plus" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Enhanced Add Room Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1">
          <View className="flex-1 bg-black bg-opacity-50 justify-center px-4">
            <View
              style={{
                backgroundColor: themeColors.surface,
                borderRadius: 24,
                padding: 24,
                maxWidth: 384,
                marginHorizontal: 'auto',
                width: '100%',
              }}>
              {/* Modal Header */}
              <View className="items-center mb-6">
                <View
                  style={{
                    width: 64,
                    height: 64,
                    backgroundColor: isDark
                      ? RentAppColors.primary[900] + '40'
                      : RentAppColors.primary[100],
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                  <Icon name="door-open" size={24} color="#3B82F6" />
                </View>
                <ThemedText size="xl" weight="bold" style={{marginBottom: 8}}>
                  Add New Room
                </ThemedText>
                <ThemedText
                  variant="secondary"
                  size="sm"
                  style={{textAlign: 'center'}}>
                  Create a new room in {property?.name}
                </ThemedText>
              </View>

              {/* Room Name Input */}
              <View className="mb-6">
                <ThemedText size="sm" weight="medium" style={{marginBottom: 8}}>
                  Room Name *
                </ThemedText>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: themeColors.surfaceVariant,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                    borderWidth: 2,
                    borderColor: focusedField
                      ? RentAppColors.primary[500]
                      : errorMessage
                      ? RentAppColors.status.error
                      : themeColors.border,
                  }}>
                  <Icon
                    name="door"
                    size={20}
                    color={focusedField ? '#3B82F6' : '#9CA3AF'}
                  />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: themeColors.text.primary,
                    }}
                    placeholder="e.g., Room 101, Master Bedroom"
                    placeholderTextColor="#9CA3AF"
                    value={newRoomName}
                    onChangeText={text => {
                      setNewRoomName(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onFocus={() => setFocusedField(true)}
                    onBlur={() => setFocusedField(false)}
                    autoFocus
                  />
                </View>
                {errorMessage && (
                  <Text className="text-red-500 text-sm mt-1 ml-1">
                    {errorMessage}
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              <View className="flex-row" style={{gap: 12}}>
                <TouchableOpacity
                  onPress={closeModal}
                  style={{
                    flex: 1,
                    backgroundColor: themeColors.surfaceVariant,
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}>
                  <ThemedText size="base" weight="semibold">
                    Cancel
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAddRoom}
                  disabled={loadingAdd || !newRoomName.trim()}
                  style={{
                    flex: 1,
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor:
                      loadingAdd || !newRoomName.trim()
                        ? themeColors.surfaceVariant
                        : RentAppColors.primary[500],
                  }}>
                  {loadingAdd ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="white" />
                      <ThemedText
                        size="base"
                        weight="semibold"
                        style={{marginLeft: 8, color: '#FFFFFF'}}>
                        Adding...
                      </ThemedText>
                    </View>
                  ) : (
                    <View className="flex-row items-center">
                      <Icon name="check" size={16} color="white" />
                      <ThemedText
                        size="base"
                        weight="semibold"
                        style={{marginLeft: 8, color: '#FFFFFF'}}>
                        Add Room
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default PropertyDetailScreen;
