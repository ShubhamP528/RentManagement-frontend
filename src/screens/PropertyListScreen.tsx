/* eslint-disable react-native/no-inline-styles */
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState, useEffect, useCallback, useLayoutEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {RootStackParamList} from '../stacks/Home';
import {NODE_API_ENDPOINT} from '../constants';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../redux/store';
import {useFocusEffect} from '@react-navigation/native';
import {logout} from '../redux/authSlice';

interface Address {
  pincode: string;
  locality: string;
  address: string;
  city: string;
  state: string;
  landmark: string;
}

interface Property {
  _id: string;
  name: string;
  address: Address;
  rooms: string[];
}

type PropertiesProps = NativeStackScreenProps<RootStackParamList, 'Properties'>;

const PropertyListScreen = ({navigation}: PropertiesProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [propertyName, setPropertyName] = useState('');
  const [address, setAddress] = useState<Address>({
    pincode: '',
    locality: '',
    address: '',
    city: '',
    state: '',
    landmark: '',
  });
  const [rooms, setRooms] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [AddLoading, setAddLoading] = useState<boolean>(false);

  const currentUser = useSelector((state: RootState) => state.auth.user);

  const getAllProperties = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${NODE_API_ENDPOINT}/properties/get-properties`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser?.token}`,
          },
        },
      );
      if (!response.ok) {
        setLoading(false);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      console.log(data.properties);

      setProperties(data.properties);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  }, [currentUser?.token]);

  // / Re-fetch property details when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (currentUser?.token) {
        getAllProperties();
      }
    }, [getAllProperties, currentUser?.token]),
  );

  const addProperty = async () => {
    if (!propertyName || !address) {
      return;
    }

    try {
      setAddLoading(true);
      console.log(AddLoading);
      const response = await fetch(
        `${NODE_API_ENDPOINT}/properties/add-property`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser?.token}`,
          },
          body: JSON.stringify({
            propertyName: propertyName,
            address,
            // rooms: rooms.split(',').map(room => room.trim()),
            rooms: [],
          }),
        },
      );
      if (!response.ok) {
        setAddLoading(false);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
      setAddLoading(false);
      Alert.alert('Success', 'Property added successfully');
      setModalVisible(false);

      // Update the properties list with the new property
      setProperties([...properties, data]);
    } catch (error) {
      setAddLoading(false);
      console.error('Error:', error);
    }

    // setProperties([...properties, newProperty]);
    setPropertyName('');
    setAddress({
      pincode: '',
      locality: '',
      address: '',
      city: '',
      state: '',
      landmark: '',
    });
    setRooms('');
    setModalVisible(false);
  };

  const handleOpenProperty = (property: string) => {
    navigation.push('PropertyDetail', {propertyId: property});
  };

  const dispatch = useDispatch();

  useLayoutEffect(() => {
    const handleLogout = () => {
      // Clear user data and logout
      dispatch(logout());
      // Redirect to login screen or any other screen
      navigation.replace('Login');
    };

    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-600 px-2 py-1 rounded-lg"
          style={{
            marginRight: 15,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text className="text-white text-base font-semibold">Logout</Text>
        </TouchableOpacity>
      ),
      headerTitleAlign: 'left', // Center the title (optional)
    });
  }, [dispatch, navigation]);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#0000ff"
        style={{flex: 1, justifyContent: 'center'}}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-6">
      {properties.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-gray-500 mb-4">
            No properties available
          </Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={item => item._id}
          renderItem={({item}) => (
            <Pressable
              onPress={() => handleOpenProperty(item._id)}
              key={item._id}
              className="bg-white p-6 rounded-xl mb-6 flex-row items-center"
              style={{
                boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px',
              }}>
              <Icon
                name="home-outline"
                size={50}
                color="#3B82F6"
                style={{marginRight: 16}}
              />
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-800 mb-1">
                  {item.name}
                </Text>
                <Text className="text-gray-600 mb-1">
                  {item.address.locality}, {item.address.city}
                </Text>
                <Text className="text-gray-500">
                  Rooms: {item.rooms.length}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* Floating + Button to Open Modal */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 30,
          right: 30,
          backgroundColor: '#3B82F6',
          padding: 18,
          borderRadius: 50,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8,
        }}
        onPress={() => setModalVisible(true)}>
        <Icon name="add" size={36} color="white" />
      </TouchableOpacity>

      {/* Modal for Adding Property */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-opacity-50">
          <View
            className="w-11/12 bg-white p-8 rounded-2xl shadow-lg"
            style={{
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 8},
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 12,
            }}>
            <Text className="text-2xl font-bold text-gray-800 mb-6">
              Add New Property
            </Text>

            <TextInput
              className="w-full p-4 border border-gray-300 rounded-lg mb-4"
              placeholder="Property Name"
              value={propertyName}
              onChangeText={setPropertyName}
            />

            {Object.keys(address).map(key => (
              <TextInput
                key={key}
                className="w-full p-4 border border-gray-300 rounded-lg mb-4"
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                value={address[key as keyof Address]}
                onChangeText={text =>
                  setAddress(prev => ({...prev, [key]: text}))
                }
              />
            ))}

            {/* <TextInput
              className="w-full p-4 border border-gray-300 rounded-lg mb-6"
              placeholder="Rooms (comma-separated)"
              value={rooms}
              onChangeText={setRooms}
            /> */}

            <View className="flex-row justify-between">
              <TouchableOpacity
                className="bg-red-500 px-6 py-4 rounded-lg"
                onPress={() => setModalVisible(false)}>
                <Text className="text-white text-lg font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={AddLoading}
                className="bg-blue-500 px-6 py-4 rounded-lg"
                onPress={addProperty}>
                <Text className="text-white text-lg font-semibold">
                  {AddLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    'Add Property'
                  )}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PropertyListScreen;
