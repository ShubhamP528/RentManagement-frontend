/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Button,
  Alert,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../stacks/Home';
import {NODE_API_ENDPOINT} from '../constants';
import {useSelector} from 'react-redux';
import {RootState} from '../redux/store';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
  renderers,
} from 'react-native-popup-menu';
import Icon from 'react-native-vector-icons/Ionicons';
import AddNewTenant from '../component/AddNewTenant';
import {useFocusEffect} from '@react-navigation/native';

const {width: screenWidth} = Dimensions.get('window');

interface Relation {
  relationWith: string | null;
  relationType: string;
}

interface Person {
  _id: string;
  name: string;
  dob: string;
  email: string;
  phoneNumber: string;
  gender: string;
  isHead: boolean;
  relation: Relation;
}

export interface Tenant {
  _id: string;
  headPerson: Person;
  Persons: Person[];
  startDate: string;
  endDate: string | null;
  Rent: number;
  initialReading: number;
  finalReading: number;
  PendingMoney: number;
  AdvanceMoney: number;
}

type PropertyDetailProps = NativeStackScreenProps<
  RootStackParamList,
  'RoomDetail'
>;

const TenantCarousel = ({navigation, route}: PropertyDetailProps) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showModel, setShowModel] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [addLoading, setAddLoading] = useState<boolean>(false);
  const [markingAsLeft, setMarkingAsLeft] = useState(false);

  const roomId = route.params.roomId;

  const onSave = async (obj: any) => {
    console.log(obj);
    setAddLoading(true);
    const addNewTenant = await fetch(
      `${NODE_API_ENDPOINT}/tenant/addTenant/${roomId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser?.token}`,
        },
        body: JSON.stringify(obj),
      },
    );

    if (!addNewTenant.ok) {
      setAddLoading(false);
      const resp = await addNewTenant.json();
      console.log(resp);
      console.error('Failed to add new tenant');
      Alert.alert('Error', 'Failed to add new tenant');
      return;
    }
    setAddLoading(false);
    getRoomDetails();
  };

  const getRoomDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${NODE_API_ENDPOINT}/room/details/${roomId}`,
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
        console.error('Error fetching room details');
        return;
      }
      const data = await response.json();
      setLoading(false);
      setTenants(data.tenant.reverse());
    } catch (error) {
      setLoading(false);
      console.error('Error:', error);
    }
  }, [roomId, currentUser]);

  // / Re-fetch property details when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (currentUser?.token) {
        getRoomDetails();
      }
    }, [getRoomDetails, currentUser?.token]),
  );

  useEffect(() => {
    if (currentUser) {
      getRoomDetails();
    }
  }, [currentUser, getRoomDetails, roomId]);

  const markAsLeft = async (tenantId: string) => {
    try {
      setMarkingAsLeft(true); // start spinner
      const response = await fetch(
        `${NODE_API_ENDPOINT}/tenant/removeTenant/${roomId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser?.token}`,
          },
          body: JSON.stringify({endDate: new Date().toISOString(), tenantId}),
        },
      );
      if (!response.ok) {
        setMarkingAsLeft(false);
        console.error('Error marking tenant as left', response);
        return;
      }
      // Refresh tenant list
      const updatedTenants = tenants.map(t =>
        t._id === tenantId ? {...t, endDate: new Date().toISOString()} : t,
      );
      setTenants(updatedTenants);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setMarkingAsLeft(false); // stop spinner
    }
  };

  const capitalizeFirstLetter = str =>
    str.charAt(0).toUpperCase() + str.slice(1);

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#0000ff"
        style={{flex: 1, justifyContent: 'center'}}
      />
    );
  }

  // Update index when user finishes swiping
  const handleMomentumScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    setCurrentIndex(index);
  };

  const renderTenantCard = ({item}: {item: Tenant}) => (
    <View
      key={item._id}
      style={{
        width: screenWidth * 0.9,
        marginHorizontal: screenWidth * 0.05,
        height: '90%', // give consistent height
      }}
      className="p-8 rounded-3xl  shadow-md mt-5 h-5/6 bg-white ">
      <ScrollView
        // contentContainerStyle={{padding: 32}}
        showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold mb-2 text-gray-800">
            {item.headPerson.name}
          </Text>
          {/* // In your renderTenantCard component, use: */}
          <Menu renderer={renderers.ContextMenu}>
            <MenuTrigger>
              <Text className="text-3xl">⋯</Text>
            </MenuTrigger>
            <MenuOptions
              customStyles={{
                optionsContainer: {
                  padding: 5,
                  backgroundColor: '#fff',
                  borderRadius: 5,
                },
              }}>
              {item.endDate === null && (
                <MenuOption
                  onSelect={() => {
                    Alert.alert(
                      'Confirm Action',
                      'Are you sure you want to mark this tenant as left?',
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel',
                        },
                        {
                          text: 'Yes, Mark as Left',
                          style: 'destructive',
                          onPress: () => markAsLeft(item._id),
                        },
                      ],
                      {cancelable: true},
                    );
                  }}>
                  <Text className="text-lg text-red-600">Mark as Left</Text>
                </MenuOption>
              )}
              <MenuOption
                onSelect={() =>
                  navigation.push('TransactionDetails', {
                    tenantId: item._id,
                    roomId,
                    previousReading: item.finalReading,
                  })
                }>
                <Text className="text-lg text-blue-600">Show Transactions</Text>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>

        <Text
          className={`text-xl ${
            item.endDate ? 'text-red-500' : 'text-green-500'
          }`}>
          {item.endDate ? 'Past Tenant' : 'Current Tenant'}{' '}
          {item.endDate === null && '• Living Now'}
        </Text>
        <Text className="text-lg font-semibold text-gray-500">
          Start:{' '}
          {`${new Date(item.startDate).getDate()}/${
            new Date(item.startDate).getMonth() + 1
          }/${new Date(item.startDate).getFullYear()}`}{' '}
        </Text>
        {item.endDate && (
          <Text className="text-lg font-semibold text-gray-500">
            End:{' '}
            {`${new Date(item.endDate).getDate()}/${
              new Date(item.endDate).getMonth() + 1
            }/${new Date(item.endDate).getFullYear()}`}{' '}
          </Text>
        )}
        <Text className="text-lg font-semibold text-gray-500">
          Rent: ₹{item.Rent}
        </Text>
        <Text className="text-xl font-bold text-green-500">
          Advance Amount: ₹{item.AdvanceMoney}
        </Text>
        <Text className="text-xl font-bold text-red-500">
          Pending Amount: ₹{item.PendingMoney}
        </Text>

        <Text className="text-xl font-extrabold mt-8 mb-4 text-gray-800">
          Family Members:
        </Text>
        {item.Persons.map(person => (
          <View key={person._id} className="mb-3">
            <Text className="text-lg font-bold text-gray-700">
              {person.name} {person.isHead ? '(Head)' : ''}
            </Text>
            <Text className="text-sm font-semibold text-gray-500">
              Gender: {capitalizeFirstLetter(person.gender)}
            </Text>
            <Text className="text-sm font-semibold text-gray-500">
              DOB: {new Date(person.dob).toLocaleDateString()}
            </Text>
            <Text className="text-sm font-semibold text-gray-500">
              Email: {person.email}
            </Text>
            <Text className="text-sm font-semibold text-gray-500">
              Mobile No: {person.phoneNumber}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  console.log(tenants);
  console.log(tenants.find(item => item.endDate === null));

  return (
    <View className="flex-1 bg-gray-100">
      {/* No Tenants Found Message */}
      {!loading && tenants.length === 0 && (
        <View className="flex-1 bg-gray-100 items-center justify-center">
          <Text className="text-xl font-bold text-gray-800">
            No Tenants Found
          </Text>
        </View>
      )}
      <FlatList
        data={tenants}
        renderItem={renderTenantCard}
        keyExtractor={item => item._id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      />

      {/* Pagination Dots */}
      <View className="flex-row justify-center mt-3 mb-12">
        {tenants.map((_, idx) => (
          <View
            key={idx}
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              marginHorizontal: 4,
              backgroundColor: idx === currentIndex ? '#3B82F6' : '#171818', // blue vs gray
            }}
          />
        ))}
      </View>

      {/* Floating + Button to Open Modal */}
      {!tenants.find(item => item.endDate === null) && (
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
          onPress={() => setShowModel(true)}>
          <Icon name="add" size={36} color="white" />
        </TouchableOpacity>
      )}
      {markingAsLeft && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{color: '#fff', marginTop: 10}}>Marking as left...</Text>
        </View>
      )}

      <AddNewTenant
        loading={addLoading}
        visible={showModel}
        onClose={() => setShowModel(false)}
        onSave={onSave}
      />
    </View>
  );
};

export default TenantCarousel;
