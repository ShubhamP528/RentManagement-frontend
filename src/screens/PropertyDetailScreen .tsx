/* eslint-disable react-native/no-inline-styles */
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
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {RootStackParamList} from '../stacks/Home';
import {NODE_API_ENDPOINT} from '../constants';
import {useSelector} from 'react-redux';
import {RootState} from '../redux/store';
import {useFocusEffect} from '@react-navigation/native';

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

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
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
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [currentUser?.token, propertyId, fadeAnim]);

  const fetchPropertyDetails = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [propertyId, currentUser?.token]);

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

      Alert.alert('Success', 'Room added successfully!');
      setModalVisible(false);
      setNewRoomName('');
    } catch (error) {
      console.error('Error adding room:', error);
      Alert.alert('Error', 'Failed to add room.');
    } finally {
      setLoadingAdd(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setErrorMessage('');
    setNewRoomName('');
  };

  // Room item animation and layout
  const renderRoomItem = ({item: room}: {item: Room}) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          },
        ],
      }}>
      <TouchableOpacity
        className="bg-white rounded-2xl p-6 mb-6 shadow-lg shadow-gray-400"
        activeOpacity={0.8}
        onPress={() =>
          navigation.push('RoomDetail', {
            roomId: room._id,
          })
        }>
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Icon name="bed-outline" size={28} color="#3B82F6" />
            <Text className="text-xl font-semibold text-gray-900 ml-3">
              {room.name}
            </Text>
          </View>

          <Text
            className={`font-medium ${
              room.tenant.length > 0 &&
              room.tenant[room.tenant.length - 1].endDate === null
                ? 'text-green-500'
                : 'text-red-500'
            }`}>
            {room.tenant.length > 0 &&
            room.tenant[room.tenant.length - 1].endDate === null
              ? 'Booked ✅'
              : 'Vacant ⛔'}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="bg-white rounded-3xl p-8 shadow-2xl shadow-gray-500">
        <View className="flex-row items-center mb-6">
          <Icon name="home" size={45} color="#2563EB" />
          <Text className="text-3xl font-extrabold text-gray-900 ml-4">
            {property?.name}
          </Text>
        </View>
        <Text className="text-gray-700 mb-4 leading-6">
          📍 {property?.address.address}, {property?.address.locality},{' '}
          {property?.address.city}, {property?.address.state} -{' '}
          {property?.address.pincode}
        </Text>
        <Text className="text-gray-600 mb-2">
          🏷️ <Text className="font-semibold">Landmark:</Text>{' '}
          {property?.address.landmark}
        </Text>
        <Text className="text-gray-600">
          🛏️ <Text className="font-semibold">Total Rooms:</Text>{' '}
          {property?.rooms.length}
        </Text>
        {property?.rooms?.length !== undefined &&
          property?.rooms?.length > 0 && (
            <Text className="text-2xl font-bold text-gray-900 mt-8">
              Available Rooms
            </Text>
          )}
      </View>
      {property?.rooms?.length === undefined ||
      property?.rooms?.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 text-lg">No rooms available</Text>
        </View>
      ) : null}

      <FlatList
        data={property?.rooms ?? []}
        keyExtractor={item => item._id}
        renderItem={renderRoomItem}
        contentContainerStyle={{padding: 16}}
      />

      <TouchableOpacity
        className="bg-blue-600 rounded-full p-4 absolute bottom-8 right-8"
        onPress={() => setModalVisible(true)}>
        <Icon name="add" size={35} color="white" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-8 rounded-2xl w-4/5">
            <Text className="text-lg font-bold mb-4">Add New Room</Text>
            <TextInput
              placeholder="Enter room name"
              placeholderTextColor="#9CA3AF"
              value={newRoomName}
              onChangeText={setNewRoomName}
              className="border rounded-lg p-4 mb-4"
            />
            {errorMessage ? (
              <Text className="text-red-500 mb-4">{errorMessage}</Text>
            ) : null}

            <TouchableOpacity
              onPress={closeModal}
              className="bg-gray-400 p-4 rounded-lg mb-4">
              <Text className="text-white text-center">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddRoom}
              className="bg-blue-600 p-4 rounded-lg">
              {loadingAdd ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white text-center">Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PropertyDetailScreen;
