/* eslint-disable react-native/no-inline-styles */
import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import {Picker} from '@react-native-picker/picker';

interface Relation {
  relationWith: string | null;
  relationType: string;
}

interface Person {
  name: string;
  dob: string;
  email: string;
  phoneNumber: string;
  gender: string;
  isHead: boolean;
  relation: Relation;
}

interface TenantData {
  startDate: string;
  endDate: string | null;
  Rent: string;
  initialReading: string;
  // PendingMoney: string;
  // AdvanceMoney: string;
}

interface TenantFormModalProps {
  loading: boolean;
  visible: boolean;
  onClose: () => void;
  onSave: (data: {personsData: Person[]; tenantData: TenantData}) => void;
}

const AddNewTenant: React.FC<TenantFormModalProps> = ({
  loading,
  visible,
  onClose,
  onSave,
}) => {
  const [personsData, setPersonsData] = useState<Person[]>([]);
  const [tenantData, setTenantData] = useState<TenantData>({
    startDate: '',
    endDate: null,
    Rent: '',
    initialReading: '',
    // PendingMoney: '',
    // AdvanceMoney: '',
  });
  const [errors, setErrors] = useState<{
    personsData: boolean[];
    tenantData: Record<string, boolean>;
  }>({
    personsData: [],
    tenantData: {
      startDate: false,
      Rent: false,
      initialReading: false,
      // PendingMoney: false,
      // AdvanceMoney: false,
    },
  });

  console.log(personsData);

  const addPerson = () => {
    setPersonsData([
      ...personsData,
      {
        name: '',
        dob: '',
        email: '',
        phoneNumber: '',
        gender: '',
        isHead: false,
        relation: {relationWith: null, relationType: ''},
      },
    ]);
  };

  const removePerson = (index: number) => {
    setPersonsData(personsData.filter((_, i) => i !== index));
  };

  const updatePerson = (index: number, key: keyof Person, value: any) => {
    const updatedPersons = [...personsData];
    updatedPersons[index][key] = value;
    setPersonsData(updatedPersons);
  };

  const updateRelation = (index: number, key: keyof Relation, value: any) => {
    const updatedPersons = [...personsData];
    updatedPersons[index].relation[key] = value;
    setPersonsData(updatedPersons);
  };

  const handleSave = async () => {
    let hasError = false;
    let newErrors = {
      personsData: [],
      tenantData: {
        startDate: false,
        Rent: false,
        initialReading: false,
        // PendingMoney: false,
        // AdvanceMoney: false,
      },
    };

    // Validate Tenant Data
    Object.keys(tenantData).forEach(key => {
      if (key !== 'endDate' && !tenantData[key as keyof TenantData]) {
        newErrors.tenantData[key as keyof TenantData] = true;
        hasError = true;
      }
    });

    console.log(newErrors);
    console.log(hasError);
    // Validate Persons Data
    const newPersonsErrors = personsData.map(person => {
      const isInvalid =
        !person.name ||
        !person.dob ||
        !person.email ||
        !person.phoneNumber ||
        !person.gender;
      if (isInvalid) {
        hasError = true;
      }
      return isInvalid;
    });

    newErrors.personsData = newPersonsErrors;

    console.log(hasError);

    if (hasError) {
      setErrors(newErrors);
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    if (personsData.length === 0) {
      Alert.alert('Validation Error', 'Please Add at least one person');
      return;
    }
    console.log(personsData);
    const HeadPerson = personsData.filter(p => p.isHead);
    console.log(HeadPerson);
    if (HeadPerson.length === 0) {
      Alert.alert('Validation Error', 'Please Select a person is Head');
      return;
    }

    if (HeadPerson.length > 1) {
      Alert.alert('Validation Error', 'Only one person Should be Head');
      return;
    }

    await onSave({personsData, tenantData});
    onClose();
  };

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isDatePickerVisibleDOB, setDatePickerVisibilityDOB] = useState(false);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const showDatePickerDOB = () => setDatePickerVisibilityDOB(true);
  const hideDatePickerDOB = () => setDatePickerVisibilityDOB(false);

  const handleStartDateConfirm = selectedDate => {
    setTenantData({
      ...tenantData,
      startDate: new Date(selectedDate).toISOString(),
    });
    hideDatePicker();
  };

  const [selectedIndex, setSelectedIndex] = useState(0);
  const handleDOBConfirm = selectedDate => {
    const updatedPersons = [...personsData];
    updatedPersons[selectedIndex]['dob'] = new Date(selectedDate).toISOString();
    setPersonsData(updatedPersons);
    hideDatePickerDOB();
  };

  console.log(tenantData);
  console.log(personsData);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-center p-6">
        <View className="bg-white p-5 rounded-lg">
          <Text className="text-lg font-bold mb-2">Tenant Details</Text>

          <ScrollView
            className="max-h-[550px]"
            showsVerticalScrollIndicator={false}>
            <View className="">
              <TouchableOpacity
                onPress={showDatePicker}
                className="flex-row justify-between border mb-2 items-center p-2 rounded">
                <Text
                  style={{
                    fontSize: 16,
                    height: 50,
                    textAlignVertical: 'center',
                  }}
                  className={`${
                    tenantData.startDate ? 'text-black' : 'text-gray-700'
                  } text-base`}>
                  {tenantData.startDate
                    ? `${new Date(tenantData.startDate).getDate()}/${
                        new Date(tenantData.startDate).getMonth() + 1
                      }/${new Date(tenantData.startDate).getFullYear()}`
                    : ' Select Start Date'}
                </Text>
                <Icon name="calendar" size={20} color="#050505" />
              </TouchableOpacity>

              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleStartDateConfirm}
                onCancel={hideDatePicker}
              />
            </View>

            <TextInput
              className={`border p-2 rounded mb-2 ${
                errors.tenantData.Rent ? 'border-red-500' : ''
              }`}
              placeholder="Rent"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              onChangeText={text => setTenantData({...tenantData, Rent: text})}
              value={tenantData.Rent}
              style={{fontSize: 16, height: 50}}
            />
            <TextInput
              className="border p-2 rounded mb-2"
              placeholder="Initial Reading"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              onChangeText={text =>
                setTenantData({...tenantData, initialReading: text})
              }
              value={tenantData.initialReading}
              style={{fontSize: 16, height: 50}}
            />
            {/* <TextInput
              className="border p-2 rounded mb-2"
              placeholder="Pending Money"
              keyboardType="numeric"
              onChangeText={text =>
                setTenantData({...tenantData, PendingMoney: text})
              }
              value={tenantData.PendingMoney}
              style={{fontSize: 16, height: 50}}
            /> */}

            {/* <TextInput
              className="border p-2 rounded mb-2"
              placeholder="Advance Money"
              keyboardType="numeric"
              onChangeText={text =>
                setTenantData({...tenantData, AdvanceMoney: text})
              }
              value={tenantData.AdvanceMoney}
              style={{fontSize: 16, height: 50}}
            /> */}

            <Text className="text-lg font-bold mt-4">Persons</Text>
            {personsData.map((person, index) => (
              <View key={index} className="border p-4 rounded-lg mb-4">
                <TextInput
                  className={`border p-2 rounded mb-2 ${
                    errors.personsData[index] ? 'border-red-500' : ''
                  }`}
                  // className="border p-2 rounded mb-2"
                  placeholder="Name"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={text => updatePerson(index, 'name', text)}
                  value={person.name}
                  style={{fontSize: 16, height: 50}}
                />

                <View className="">
                  <TouchableOpacity
                    onPress={() => {
                      showDatePickerDOB();
                      setSelectedIndex(index);
                    }}
                    className="flex-row justify-between border mb-2 items-center p-2 rounded">
                    <Text
                      className={`${
                        person.dob ? 'text-black' : 'text-gray-700'
                      } ${
                        errors.personsData[index] ? 'border-red-500' : ''
                      } text-base`}
                      style={{
                        fontSize: 16,
                        height: 50,
                        textAlignVertical: 'center',
                      }}>
                      {person.dob
                        ? `${new Date(person.dob).getDate()}/${
                            new Date(person.dob).getMonth() + 1
                          }/${new Date(person.dob).getFullYear()}`
                        : 'Select DOB'}
                    </Text>
                    <Icon name="calendar" size={20} color="#050505" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  className="border p-2 rounded mb-2"
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={text => updatePerson(index, 'email', text)}
                  value={person.email}
                  style={{fontSize: 16, height: 50}}
                />

                <TextInput
                  className="border p-2 rounded mb-2"
                  placeholder="Mobile Number"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={text =>
                    updatePerson(index, 'phoneNumber', text)
                  }
                  value={person.phoneNumber}
                  style={{fontSize: 16, height: 50}}
                />

                <View className="border rounded mb-2">
                  <Picker
                    selectedValue={person.gender}
                    onValueChange={itemValue =>
                      updatePerson(index, 'gender', itemValue)
                    }
                    mode="dropdown"
                    style={{
                      height: 50,
                      fontSize: 16,
                    }}
                    itemStyle={{fontSize: 16}}>
                    <Picker.Item label="Select Gender" value="" />
                    <Picker.Item label="Male" value="male" />
                    <Picker.Item label="Female" value="female" />
                  </Picker>
                </View>

                <View className="border rounded mb-2">
                  <Picker
                    selectedValue={String(person.isHead)}
                    onValueChange={itemValue =>
                      updatePerson(
                        index,
                        'isHead',
                        itemValue === 'Yes' ? true : false,
                      )
                    }
                    mode="dropdown"
                    style={{
                      height: 50,
                      fontSize: 16,
                    }}
                    itemStyle={{fontSize: 16}}>
                    <Picker.Item label="Is Head Person" value="" />
                    <Picker.Item label="Yes" value="Yes" />
                    <Picker.Item label="No" value="No" />
                  </Picker>
                </View>

                <TextInput
                  style={{fontSize: 16, height: 50}}
                  className="border p-2 rounded mb-2"
                  placeholder="Relation Type"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={text =>
                    updateRelation(index, 'relationType', text)
                  }
                  value={person.relation.relationType}
                />
                <TouchableOpacity
                  className="bg-red-500 p-2 rounded mt-2"
                  onPress={() => removePerson(index)}>
                  <Text className="text-white text-center">Remove Person</Text>
                </TouchableOpacity>
              </View>
            ))}
            <DateTimePickerModal
              isVisible={isDatePickerVisibleDOB}
              mode="date"
              onConfirm={handleDOBConfirm}
              onCancel={hideDatePickerDOB}
            />
            <TouchableOpacity
              className="bg-blue-500 p-3 rounded mt-2"
              onPress={addPerson}>
              <Text className="text-white text-center">Add Person</Text>
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity
            className="bg-green-500 p-3 rounded mt-3"
            onPress={handleSave}
            disabled={loading}>
            <Text className="text-white text-center">
              {' '}
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#0000ff"
                  style={{flex: 1, justifyContent: 'center'}}
                />
              ) : (
                'Save'
              )}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-gray-500 p-3 rounded mt-2"
            onPress={onClose}>
            <Text className="text-white text-center">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AddNewTenant;
