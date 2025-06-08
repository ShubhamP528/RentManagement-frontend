/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../stacks/Home';
import {NODE_API_ENDPOINT} from '../constants';
import {useSelector} from 'react-redux';
import {RootState} from '../redux/store';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DatePicker from 'react-native-date-picker';
import {BlurView} from '@react-native-community/blur';

interface Transaction {
  _id: string;
  DOP: string;
  MOP: string;
  RoomRent: number;
  currentReading: number;
  previousReading: number;
  BuildReading: number;
  Bill: number;
  totalAmount: number;
  status: string;
}

type TransactionListProps = NativeStackScreenProps<
  RootStackParamList,
  'TransactionDetails'
>;

const TransactionList = ({route}: TransactionListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Form fields for adding new payment
  // const [DOP, setDOP] = useState('');
  const [DOP, setDOP] = useState(new Date());
  const [MOP, setMOP] = useState('');
  const [RoomRent, setRoomRent] = useState('');
  const [currentReading, setCurrentReading] = useState('');
  // const [previousReading, setPreviousReading] = useState('');
  // const [BuildReading, setBuildReading] = useState('');
  // const [Bill, setBill] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [addLoading, setAddLoading] = useState<boolean>(false);
  // status is static "Paid" for this payload.
  const status = 'Paid';

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const {tenantId, roomId, previousReading} = route.params; // Assuming roomId is also passed in the route

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${NODE_API_ENDPOINT}/tenant/getTransaction/${tenantId}`,
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
          console.error('Error fetching transactions');
          return;
        }
        setLoading(false);
        const data = await response.json();
        console.log(data);
        setTransactions(data.transaction);
      } catch (error) {
        setLoading(false);
        Alert.alert('Error', 'An error occurred while fetching transactions.');
        console.error('Error:', error);
      }
    };

    if (currentUser) {
      fetchTransactions();
    }
  }, [currentUser, tenantId]);

  const handleAddPayment = async () => {
    if (
      !DOP ||
      !MOP ||
      !RoomRent ||
      !currentReading ||
      !previousReading
      // !BuildReading ||
      // !Bill
    ) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    if (Number(previousReading) > Number(currentReading)) {
      Alert.alert(
        'Validation Error',
        'Current reading must be greater than previous reading.',
      );
    }

    const payload = {
      room: roomId, // room should be passed as a route param
      tenant: tenantId,
      DOP,
      MOP,
      RoomRent: Number(RoomRent),
      currentReading: Number(currentReading),
      previousReading: Number(previousReading),
      BuildReading: Number(currentReading) - Number(previousReading),
      Bill: (Number(currentReading) - Number(previousReading)) * 6,
      status,
    };

    try {
      setAddLoading(true);
      const response = await fetch(`${NODE_API_ENDPOINT}/payment/addPayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser?.token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setAddLoading(false);
        console.log(response);
        Alert.alert('Error', 'Failed to add payment.');
        return;
      }
      setAddLoading(false);
      const transec = await response.json();
      Alert.alert('Success', 'Payment added successfully.');

      // Optionally, refresh the list by re-fetching transactions.
      setTransactions([...transactions, transec.payment]);

      setIsModalVisible(false);
    } catch (error) {
      setAddLoading(false);
      console.error('Error:', error);
      Alert.alert('Error', 'An error occurred while adding the payment.');
    }
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#0000ff"
        style={{flex: 1, justifyContent: 'center'}}
      />
    );
  }

  const renderTransaction = ({item}: {item: Transaction}) => (
    <View key={item._id} className="bg-white p-6 rounded-3xl shadow-lg mb-6">
      <Text className="text-2xl font-extrabold text-gray-800 mb-2">
        {`(${item.MOP}) Payment`}
      </Text>
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-gray-500">Date:</Text>
        <Text className="text-sm font-medium text-gray-700">
          {/* {new Date(item.DOP).toLocaleDateString()} */}
          {`${new Date(item.DOP).getDate()}/${
            new Date(item.DOP).getMonth() + 1
          }/${new Date(item.DOP).getFullYear()}`}{' '}
        </Text>
      </View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-gray-500">Room Rent:</Text>
        <Text className="text-sm font-medium text-gray-700">
          ₹{item.RoomRent}
        </Text>
      </View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-gray-500">Electricity Bill:</Text>
        <Text className="text-sm font-medium text-gray-700">₹{item.Bill}</Text>
      </View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-gray-500">Current Reading:</Text>
        <Text className="text-sm font-medium text-gray-700">
          {item.currentReading} units
        </Text>
      </View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-gray-500">Previous Reading:</Text>
        <Text className="text-sm font-medium text-gray-700">
          {item.previousReading} units
        </Text>
      </View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-gray-500">Consumed Units:</Text>
        <Text className="text-sm font-medium text-gray-700">
          {item.BuildReading} units
        </Text>
      </View>
      <View className="border-t border-gray-300 my-4" />
      <View className="flex-row justify-between items-center">
        <Text className="text-xl font-semibold text-gray-800">Total:</Text>
        <Text className="text-xl font-bold text-blue-600">
          ₹{item.totalAmount}
        </Text>
      </View>
      <Text
        className={`text-sm font-bold text-center mt-4 ${
          item.status === 'Paid' ? 'text-green-600' : 'text-red-600'
        }`}>
        {item.status}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* No Tenants Found Message */}
      {!loading && transactions.length === 0 && (
        <View className="flex-1 bg-gray-100 items-center justify-center">
          <Text className="text-xl font-bold text-gray-800">
            No Transaction Found
          </Text>
        </View>
      )}
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={item => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 24,
          paddingTop: 12,
        }}
      />

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
        onPress={() => setIsModalVisible(true)}>
        <Icon name="add" size={36} color="white" />
      </TouchableOpacity>

      {/* Modal for adding new payment */}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}>
        <View className="flex-1 justify-center items-center relative">
          {/* Blur background */}
          <BlurView
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
            blurType="light" // Options: "light", "dark", "extraLight"
            blurAmount={20} // Adjust the blur intensity
            reducedTransparencyFallbackColor="rgba(0,0,0,0.5)"
          />

          {/* Modal Content */}
          <View className="bg-white w-full p-6 rounded-3xl shadow-lg">
            <Text className="text-2xl font-bold text-gray-800 mb-4">
              Add New Payment
            </Text>

            <View className="mb-6">
              <Text className="text-xl text-gray-800 font-semibold mb-3">
                Date of Payment
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-300 shadow-sm">
                <Text className="text-gray-800 text-lg font-medium">
                  {`${DOP.getDate()}/${
                    DOP.getMonth() + 1
                  }/${DOP.getFullYear()}`}{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center gap-2 bg-blue-500 px-4 py-2 rounded-lg">
                  <MaterialIcons name="edit" size={22} color="white" />
                  <Text className="text-white text-base font-semibold">
                    Edit Date
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            <DatePicker
              mode="date"
              modal
              open={showDatePicker}
              date={DOP}
              onConfirm={date => {
                setShowDatePicker(false);
                setDOP(date);
              }}
              onCancel={() => {
                setShowDatePicker(false);
              }}
            />

            {/* Month of Payment */}
            <Text className="text-lg text-gray-700 mb-1">Month of Payment</Text>
            <TextInput
              placeholder="March - April"
              value={MOP}
              onChangeText={setMOP}
              className="bg-gray-200 rounded-md p-3 mb-3"
            />

            {/* Room Rent */}
            <Text className="text-lg text-gray-700 mb-1">Room Rent (₹)</Text>
            <TextInput
              placeholder="500"
              value={RoomRent}
              onChangeText={setRoomRent}
              keyboardType="numeric"
              className="bg-gray-200 rounded-md p-3 mb-3"
            />

            {/* Current Reading */}
            <Text className="text-lg text-gray-700 mb-1">
              Current Reading (units)
            </Text>
            <TextInput
              placeholder="200"
              value={currentReading}
              onChangeText={setCurrentReading}
              keyboardType="numeric"
              className="bg-gray-200 rounded-md p-3 mb-3"
            />

            {/* Previous Reading */}
            <Text className="text-lg text-gray-700 mb-1">
              Previous Reading (units)
            </Text>
            <Text
              // placeholder="150"
              // value={previousReading}
              // onChangeText={setPreviousReading}
              // keyboardType="numeric"
              className="bg-gray-200 rounded-md p-3 mb-3">
              {previousReading}
            </Text>

            {/* Consumed Units */}
            <Text className="text-lg text-gray-700 mb-1">Consumed Units</Text>
            <Text
              // placeholder="50"
              // value={BuildReading}
              // onChangeText={setBuildReading}
              // keyboardType="numeric"
              className="bg-gray-200 rounded-md p-3 mb-3">
              {Number(currentReading) - previousReading}
            </Text>

            {/* Electricity Bill */}
            <Text className="text-lg text-gray-700 mb-1">
              Electricity Bill (₹)
            </Text>
            <Text
              // placeholder="100"
              // value={Bill}
              // onChangeText={setBill}
              // keyboardType="numeric"
              className="bg-gray-200 rounded-md p-3 mb-4">
              {(Number(currentReading) - Number(previousReading)) * 6}
            </Text>

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={handleAddPayment}
                disabled={addLoading}
                className="bg-blue-600 py-3 px-6 rounded-2xl">
                <Text className="text-white text-lg font-bold">
                  {addLoading ? (
                    <ActivityIndicator
                      size="large"
                      color="#0000ff"
                      style={{flex: 1, justifyContent: 'center'}}
                    />
                  ) : (
                    'Submit'
                  )}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="bg-gray-300 py-3 px-6 rounded-2xl">
                <Text className="text-gray-800 text-lg font-bold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TransactionList;
