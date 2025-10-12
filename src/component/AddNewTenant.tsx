import React, {useState, useRef} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Picker} from '@react-native-picker/picker';
import {RentAppColors, getRentThemeColors} from '../constants/colors';
import {createThemedStyles} from '../styles/theme';
import {ThemedText} from './ThemedText';
import {useTheme} from '../contexts/ThemeContext';

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
  editMode?: boolean;
  initialPersonsData?: Person[];
  initialTenantData?: TenantData;
}

const AddNewTenant: React.FC<TenantFormModalProps> = ({
  loading,
  visible,
  onClose,
  onSave,
  editMode = false,
  initialPersonsData = [],
  initialTenantData,
}) => {
  const [personsData, setPersonsData] = useState<Person[]>([]);
  const [tenantData, setTenantData] = useState<TenantData>({
    startDate: '',
    endDate: null,
    Rent: '',
    initialReading: '',
  });
  const [errors, setErrors] = useState<{
    personsData: boolean[];
    tenantData: {[key: string]: boolean};
  }>({
    personsData: [],
    tenantData: {
      startDate: false,
      Rent: false,
      initialReading: false,
    },
  });

  console.log('personsData', personsData);
  console.log('tenantData', tenantData);

  const [currentStep, setCurrentStep] = useState(editMode ? 2 : 1);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [selectedPersonIndex, setSelectedPersonIndex] = useState(0);

  const {isDark} = useTheme();
  const themeColors = getRentThemeColors(isDark);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  // Initialize data for edit mode
  React.useEffect(() => {
    if (editMode && visible) {
      setCurrentStep(2); // Start with family members in edit mode
      if (initialPersonsData.length > 0) {
        setPersonsData(initialPersonsData);
      }
      if (initialTenantData) {
        setTenantData(initialTenantData);
      }
    } else if (!editMode && visible) {
      setCurrentStep(1); // Start with rental details in add mode
      // Reset for add mode
      setPersonsData([]);
      setTenantData({
        startDate: '',
        endDate: null,
        Rent: '',
        initialReading: '',
      });
    }
  }, [editMode, visible, initialPersonsData, initialTenantData]);

  const addPerson = () => {
    const newPerson: Person = {
      name: '',
      dob: '',
      email: '',
      phoneNumber: '',
      gender: '',
      isHead: personsData.length === 0, // First person is head by default
      relation: {relationWith: null, relationType: ''},
    };
    setPersonsData([...personsData, newPerson]);
  };

  const removePerson = (index: number) => {
    setPersonsData(personsData.filter((_, i) => i !== index));
  };

  const updatePerson = (index: number, key: keyof Person, value: any) => {
    const updatedPersons = [...personsData];
    (updatedPersons[index] as any)[key] = value;
    setPersonsData(updatedPersons);
  };

  const updateRelation = (index: number, key: keyof Relation, value: any) => {
    const updatedPersons = [...personsData];
    (updatedPersons[index].relation as any)[key] = value;
    setPersonsData(updatedPersons);
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      // Validate tenant data
      const requiredFields = ['startDate', 'Rent', 'initialReading'];
      const newErrors = {...errors};
      let hasError = false;

      requiredFields.forEach(field => {
        if (!tenantData[field as keyof TenantData]) {
          newErrors.tenantData[field] = true;
          hasError = true;
        } else {
          newErrors.tenantData[field] = false;
        }
      });

      setErrors(newErrors);
      return !hasError;
    }

    if (step === 2) {
      // Validate persons data
      if (personsData.length === 0) {
        Alert.alert('Validation Error', 'Please add at least one person');
        return false;
      }

      const headPersons = personsData.filter(p => p.isHead);
      if (headPersons.length === 0) {
        Alert.alert('Validation Error', 'Please select one person as head');
        return false;
      }

      if (headPersons.length > 1) {
        Alert.alert('Validation Error', 'Only one person can be the head');
        return false;
      }

      const newPersonsErrors = personsData.map(person => {
        return (
          !person.name ||
          !person.dob ||
          !person.email ||
          !person.phoneNumber ||
          !person.gender
        );
      });

      const hasPersonError = newPersonsErrors.some(error => error);
      if (hasPersonError) {
        setErrors({...errors, personsData: newPersonsErrors});
        Alert.alert(
          'Validation Error',
          'Please fill in all required fields for all persons',
        );
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    // In edit mode, only validate step 2 (persons). In add mode, validate current step
    if (editMode) {
      if (!validateStep(2)) return;
    } else {
      if (!validateStep(currentStep)) return;
      if (currentStep === 1) {
        nextStep();
        return;
      }
    }

    try {
      await onSave({personsData, tenantData});
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving tenant:', error);
    }
  };

  const resetForm = () => {
    setPersonsData([]);
    setTenantData({
      startDate: '',
      endDate: null,
      Rent: '',
      initialReading: '',
    });
    setCurrentStep(1);
    setErrors({
      personsData: [],
      tenantData: {
        startDate: false,
        Rent: false,
        initialReading: false,
      },
    });
    setFocusedField(null);
  };

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isDatePickerVisibleDOB, setDatePickerVisibilityDOB] = useState(false);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const showDatePickerDOB = () => setDatePickerVisibilityDOB(true);
  const hideDatePickerDOB = () => setDatePickerVisibilityDOB(false);

  const handleStartDateConfirm = (selectedDate: Date) => {
    setTenantData({
      ...tenantData,
      startDate: new Date(selectedDate).toISOString(),
    });
    hideDatePicker();
  };

  const handleDOBConfirm = (selectedDate: Date) => {
    const updatedPersons = [...personsData];
    updatedPersons[selectedPersonIndex]['dob'] = new Date(
      selectedDate,
    ).toISOString();
    setPersonsData(updatedPersons);
    hideDatePickerDOB();
  };

  console.log(tenantData);
  console.log(personsData);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{translateY: slideAnim}],
              flex: 1,
              justifyContent: 'center',
              paddingHorizontal: 16,
            }}>
            <View
              style={{
                maxHeight: '90%',
                minHeight: '70%',
                backgroundColor: themeColors.surface,
                borderRadius: 24,
              }}>
              {/* Header with Progress */}
              <View
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: themeColors.border,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}>
                  <ThemedText size="xl" weight="bold">
                    {editMode ? 'Edit Tenant Details' : 'Add New Tenant'}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => {
                      resetForm();
                      onClose();
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: themeColors.surfaceVariant,
                      borderRadius: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Icon
                      name="close"
                      size={20}
                      color={themeColors.text.primary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Progress Indicator - Hidden in Edit Mode */}
                {!editMode && (
                  <>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}>
                      <View
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor:
                              currentStep >= 1
                                ? RentAppColors.primary[500]
                                : themeColors.surfaceVariant,
                          }}>
                          <ThemedText
                            size="sm"
                            weight="semibold"
                            style={{color: '#FFFFFF'}}>
                            1
                          </ThemedText>
                        </View>
                        <View
                          style={{
                            flex: 1,
                            height: 4,
                            marginHorizontal: 8,
                            backgroundColor:
                              currentStep >= 2
                                ? RentAppColors.primary[500]
                                : themeColors.surfaceVariant,
                          }}
                        />
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor:
                              currentStep >= 2
                                ? RentAppColors.primary[500]
                                : themeColors.surfaceVariant,
                          }}>
                          <ThemedText
                            size="sm"
                            weight="semibold"
                            style={{color: '#FFFFFF'}}>
                            2
                          </ThemedText>
                        </View>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}>
                      <ThemedText size="xs" variant="tertiary">
                        Rental Details
                      </ThemedText>
                      <ThemedText size="xs" variant="tertiary">
                        Family Members
                      </ThemedText>
                    </View>
                  </>
                )}
              </View>

              <ScrollView
                style={{
                  flex: 1,
                  paddingHorizontal: 16,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{paddingBottom: 20}}>
                {/* Step 1: Rental Details - Hidden in Edit Mode */}
                {currentStep === 1 && !editMode && (
                  <View style={{paddingVertical: 16}}>
                    <View style={{alignItems: 'center', marginBottom: 24}}>
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          backgroundColor: isDark
                            ? RentAppColors.primary[900]
                            : RentAppColors.primary[100],
                          borderRadius: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 12,
                        }}>
                        <Icon
                          name="home-account"
                          size={24}
                          color={RentAppColors.primary[500]}
                        />
                      </View>
                      <ThemedText
                        size="lg"
                        weight="semibold"
                        style={{marginBottom: 4}}>
                        Rental Information
                      </ThemedText>
                      <ThemedText
                        variant="secondary"
                        style={{textAlign: 'center', fontSize: 14}}>
                        Enter the basic rental details for the new tenant
                      </ThemedText>
                    </View>

                    {/* Start Date */}
                    <View className="mb-6">
                      <ThemedText
                        size="sm"
                        weight="medium"
                        style={{marginBottom: 8}}>
                        Start Date *
                      </ThemedText>
                      <TouchableOpacity
                        onPress={showDatePicker}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: themeColors.surfaceVariant,
                          borderRadius: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 4,
                          borderWidth: 2,
                          borderColor:
                            focusedField === 'startDate'
                              ? RentAppColors.primary[500]
                              : errors.tenantData.startDate
                              ? RentAppColors.status.error
                              : themeColors.border,
                        }}>
                        <Icon
                          name="calendar"
                          size={20}
                          color={themeColors.text.tertiary}
                        />
                        <Text
                          style={{
                            flex: 1,
                            paddingVertical: 16,
                            paddingHorizontal: 12,
                            fontSize: 16,
                            color: tenantData.startDate
                              ? themeColors.text.primary
                              : themeColors.text.tertiary,
                          }}>
                          {tenantData.startDate
                            ? new Date(tenantData.startDate).toLocaleDateString(
                                'en-GB',
                              )
                            : 'Select start date'}
                        </Text>
                      </TouchableOpacity>
                      {errors.tenantData.startDate && (
                        <Text
                          style={{
                            color: RentAppColors.status.error,
                            fontSize: 14,
                            marginTop: 4,
                            marginLeft: 4,
                          }}>
                          Start date is required
                        </Text>
                      )}
                    </View>

                    {/* Monthly Rent */}
                    <View className="mb-6">
                      <ThemedText
                        size="sm"
                        weight="medium"
                        style={{marginBottom: 8}}>
                        Monthly Rent *
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
                          borderColor:
                            focusedField === 'rent'
                              ? RentAppColors.primary[500]
                              : errors.tenantData.Rent
                              ? RentAppColors.status.error
                              : themeColors.border,
                        }}>
                        <Icon
                          name="currency-inr"
                          size={20}
                          color={themeColors.text.tertiary}
                        />
                        <TextInput
                          style={{
                            flex: 1,
                            paddingVertical: 16,
                            paddingHorizontal: 12,
                            fontSize: 16,
                            color: themeColors.text.primary,
                          }}
                          placeholder="Enter monthly rent amount"
                          placeholderTextColor={themeColors.text.tertiary}
                          keyboardType="numeric"
                          value={tenantData.Rent}
                          onChangeText={text => {
                            setTenantData({...tenantData, Rent: text});
                            if (errors.tenantData.Rent) {
                              setErrors(prev => ({
                                ...prev,
                                tenantData: {...prev.tenantData, Rent: false},
                              }));
                            }
                          }}
                          onFocus={() => setFocusedField('rent')}
                          onBlur={() => setFocusedField(null)}
                        />
                      </View>
                      {errors.tenantData.Rent && (
                        <Text
                          style={{
                            color: RentAppColors.status.error,
                            fontSize: 14,
                            marginTop: 4,
                            marginLeft: 4,
                          }}>
                          Monthly rent is required
                        </Text>
                      )}
                    </View>

                    {/* Initial Reading */}
                    <View className="mb-6">
                      <ThemedText
                        size="sm"
                        weight="medium"
                        style={{marginBottom: 8}}>
                        Initial Meter Reading *
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
                          borderColor:
                            focusedField === 'reading'
                              ? RentAppColors.primary[500]
                              : errors.tenantData.initialReading
                              ? RentAppColors.status.error
                              : themeColors.border,
                        }}>
                        <Icon
                          name="gauge"
                          size={20}
                          color={themeColors.text.tertiary}
                        />
                        <TextInput
                          style={{
                            flex: 1,
                            paddingVertical: 16,
                            paddingHorizontal: 12,
                            fontSize: 16,
                            color: themeColors.text.primary,
                          }}
                          placeholder="Enter initial meter reading"
                          placeholderTextColor={themeColors.text.tertiary}
                          keyboardType="numeric"
                          value={tenantData.initialReading}
                          onChangeText={text => {
                            setTenantData({
                              ...tenantData,
                              initialReading: text,
                            });
                            if (errors.tenantData.initialReading) {
                              setErrors(prev => ({
                                ...prev,
                                tenantData: {
                                  ...prev.tenantData,
                                  initialReading: false,
                                },
                              }));
                            }
                          }}
                          onFocus={() => setFocusedField('reading')}
                          onBlur={() => setFocusedField(null)}
                        />
                      </View>
                      {errors.tenantData.initialReading && (
                        <Text
                          style={{
                            color: RentAppColors.status.error,
                            fontSize: 14,
                            marginTop: 4,
                            marginLeft: 4,
                          }}>
                          Initial reading is required
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Step 2: Family Members */}
                {currentStep === 2 && (
                  <View style={{paddingVertical: 16}}>
                    <View style={{alignItems: 'center', marginBottom: 24}}>
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          backgroundColor: isDark
                            ? RentAppColors.secondary[900]
                            : RentAppColors.secondary[100],
                          borderRadius: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 12,
                        }}>
                        <Icon
                          name="account-group"
                          size={24}
                          color={RentAppColors.secondary[500]}
                        />
                      </View>
                      <ThemedText
                        size="lg"
                        weight="semibold"
                        style={{marginBottom: 4}}>
                        Family Members
                      </ThemedText>
                      <ThemedText
                        variant="secondary"
                        style={{textAlign: 'center', fontSize: 14}}>
                        {editMode
                          ? 'Edit, add, or remove family members'
                          : 'Add all family members who will be living in this room'}
                      </ThemedText>
                    </View>

                    {/* Add Person Button */}
                    {personsData.length === 0 && (
                      <TouchableOpacity
                        onPress={addPerson}
                        style={{
                          backgroundColor: RentAppColors.primary[500],
                          paddingVertical: 16,
                          borderRadius: 12,
                          alignItems: 'center',
                          marginBottom: 24,
                        }}>
                        <View className="flex-row items-center">
                          <Icon name="plus" size={20} color="white" />
                          <ThemedText
                            weight="semibold"
                            style={{marginLeft: 8, color: '#FFFFFF'}}>
                            Add First Person
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    )}

                    {/* Person Cards */}
                    {personsData.map((person, index) => (
                      <View
                        key={index}
                        className=" rounded-2xl p-5 mb-4"
                        style={{backgroundColor: themeColors.surfaceVariant}}>
                        <View className="flex-row items-center justify-between mb-4">
                          <View className="flex-row items-center">
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12,
                                backgroundColor: person.isHead
                                  ? isDark
                                    ? RentAppColors.primary[900]
                                    : RentAppColors.primary[100]
                                  : themeColors.surfaceVariant,
                              }}>
                              <Icon
                                name={person.isHead ? 'crown' : 'account'}
                                size={18}
                                color={
                                  person.isHead
                                    ? RentAppColors.primary[500]
                                    : themeColors.text.tertiary
                                }
                              />
                            </View>
                            <ThemedText size="lg" weight="semibold">
                              Person {index + 1}
                              {person.isHead && (
                                <ThemedText
                                  style={{color: RentAppColors.primary[600]}}>
                                  {' '}
                                  (Head)
                                </ThemedText>
                              )}
                            </ThemedText>
                          </View>
                          {personsData.length > 1 && (
                            <TouchableOpacity
                              onPress={() => removePerson(index)}
                              style={{
                                width: 32,
                                height: 32,
                                backgroundColor: isDark
                                  ? RentAppColors.status.error + '20'
                                  : RentAppColors.status.error + '20',
                                borderRadius: 16,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                              <Icon
                                name="close"
                                size={16}
                                color={RentAppColors.status.error}
                              />
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Person Form Fields */}
                        <View className="space-y-4">
                          {/* Name */}
                          <View>
                            <ThemedText
                              size="sm"
                              weight="medium"
                              style={{marginBottom: 8}}>
                              Full Name *
                            </ThemedText>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: themeColors.surface,
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                paddingVertical: 4,
                                borderWidth: 1,
                                borderColor:
                                  errors.personsData[index] && !person.name
                                    ? RentAppColors.status.error
                                    : themeColors.border,
                              }}>
                              <Icon
                                name="account"
                                size={18}
                                color={themeColors.text.tertiary}
                              />
                              <TextInput
                                style={{
                                  flex: 1,
                                  paddingVertical: 12,
                                  paddingHorizontal: 12,
                                  fontSize: 16,
                                  color: themeColors.text.primary,
                                }}
                                placeholder="Enter full name"
                                placeholderTextColor={themeColors.text.tertiary}
                                value={person.name}
                                onChangeText={text =>
                                  updatePerson(index, 'name', text)
                                }
                              />
                            </View>
                          </View>

                          {/* Date of Birth */}
                          <View>
                            <ThemedText
                              size="sm"
                              weight="medium"
                              style={{marginBottom: 8}}>
                              Date of Birth *
                            </ThemedText>
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedPersonIndex(index);
                                showDatePickerDOB();
                              }}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: themeColors.surface,
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                borderWidth: 1,
                                borderColor:
                                  errors.personsData[index] && !person.dob
                                    ? RentAppColors.status.error
                                    : themeColors.border,
                              }}>
                              <Icon
                                name="cake-variant"
                                size={18}
                                color={themeColors.text.tertiary}
                              />
                              <Text
                                style={{
                                  flex: 1,
                                  paddingHorizontal: 12,
                                  fontSize: 16,
                                  color: person.dob
                                    ? themeColors.text.primary
                                    : themeColors.text.tertiary,
                                }}>
                                {person.dob
                                  ? new Date(person.dob).toLocaleDateString(
                                      'en-GB',
                                    )
                                  : 'Select date of birth'}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {/* Email */}
                          <View>
                            <ThemedText
                              size="sm"
                              weight="medium"
                              style={{marginBottom: 8}}>
                              Email Address *
                            </ThemedText>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: themeColors.surface,
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                paddingVertical: 4,
                                borderWidth: 1,
                                borderColor:
                                  errors.personsData[index] && !person.email
                                    ? RentAppColors.status.error
                                    : themeColors.border,
                              }}>
                              <Icon
                                name="email"
                                size={18}
                                color={themeColors.text.tertiary}
                              />
                              <TextInput
                                style={{
                                  flex: 1,
                                  paddingVertical: 12,
                                  paddingHorizontal: 12,
                                  fontSize: 16,
                                  color: themeColors.text.primary,
                                }}
                                placeholder="Enter email address"
                                placeholderTextColor={themeColors.text.tertiary}
                                value={person.email}
                                onChangeText={text =>
                                  updatePerson(index, 'email', text)
                                }
                                keyboardType="email-address"
                                autoCapitalize="none"
                              />
                            </View>
                          </View>

                          {/* Phone Number */}
                          <View>
                            <ThemedText
                              size="sm"
                              weight="medium"
                              style={{marginBottom: 8}}>
                              Phone Number *
                            </ThemedText>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: themeColors.surface,
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                paddingVertical: 4,
                                borderWidth: 1,
                                borderColor:
                                  errors.personsData[index] &&
                                  !person.phoneNumber
                                    ? RentAppColors.status.error
                                    : themeColors.border,
                              }}>
                              <Icon
                                name="phone"
                                size={18}
                                color={themeColors.text.tertiary}
                              />
                              <TextInput
                                style={{
                                  flex: 1,
                                  paddingVertical: 12,
                                  paddingHorizontal: 12,
                                  fontSize: 16,
                                  color: themeColors.text.primary,
                                }}
                                placeholder="Enter phone number"
                                placeholderTextColor={themeColors.text.tertiary}
                                value={person.phoneNumber}
                                onChangeText={text =>
                                  updatePerson(index, 'phoneNumber', text)
                                }
                                keyboardType="phone-pad"
                              />
                            </View>
                          </View>

                          {/* Gender and Head Person Row */}
                          <View className="flex-row" style={{gap: 12}}>
                            <View className="flex-1">
                              <ThemedText
                                size="sm"
                                weight="medium"
                                style={{marginBottom: 8}}>
                                Gender *
                              </ThemedText>
                              <View
                                style={{
                                  backgroundColor: themeColors.surface,
                                  borderRadius: 12,
                                  borderWidth: 1,
                                  borderColor:
                                    errors.personsData[index] && !person.gender
                                      ? RentAppColors.status.error
                                      : themeColors.border,
                                }}>
                                <Picker
                                  selectedValue={person.gender}
                                  onValueChange={itemValue =>
                                    updatePerson(index, 'gender', itemValue)
                                  }
                                  style={{height: 50}}>
                                  <Picker.Item label="Select Gender" value="" />
                                  <Picker.Item label="Male" value="male" />
                                  <Picker.Item label="Female" value="female" />
                                </Picker>
                              </View>
                            </View>

                            <View className="flex-1">
                              <ThemedText
                                size="sm"
                                weight="medium"
                                style={{marginBottom: 8}}>
                                Head Person
                              </ThemedText>
                              <View
                                style={{
                                  backgroundColor: themeColors.surface,
                                  borderRadius: 12,
                                  borderWidth: 1,
                                  borderColor: themeColors.border,
                                }}>
                                <Picker
                                  selectedValue={person.isHead ? 'Yes' : 'No'}
                                  onValueChange={itemValue =>
                                    updatePerson(
                                      index,
                                      'isHead',
                                      itemValue === 'Yes',
                                    )
                                  }
                                  style={{height: 50}}>
                                  <Picker.Item label="No" value="No" />
                                  <Picker.Item label="Yes" value="Yes" />
                                </Picker>
                              </View>
                            </View>
                          </View>

                          {/* Relation Type */}
                          <View>
                            <ThemedText
                              size="sm"
                              weight="medium"
                              style={{marginBottom: 8}}>
                              Relation Type
                            </ThemedText>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: themeColors.surface,
                                borderRadius: 12,
                                paddingHorizontal: 16,
                                paddingVertical: 4,
                                borderWidth: 1,
                                borderColor: themeColors.border,
                              }}>
                              <Icon
                                name="family-tree"
                                size={18}
                                color={themeColors.text.tertiary}
                              />
                              <TextInput
                                style={{
                                  flex: 1,
                                  paddingVertical: 12,
                                  paddingHorizontal: 12,
                                  fontSize: 16,
                                  color: themeColors.text.primary,
                                }}
                                placeholder="e.g., Father, Mother, Son, Daughter"
                                placeholderTextColor={themeColors.text.tertiary}
                                value={person.relation.relationType}
                                onChangeText={text =>
                                  updateRelation(index, 'relationType', text)
                                }
                              />
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}

                    {/* Add Another Person Button */}
                    {personsData.length > 0 && (
                      <TouchableOpacity
                        onPress={addPerson}
                        style={{
                          backgroundColor: themeColors.surfaceVariant,
                          paddingVertical: 16,
                          borderRadius: 12,
                          alignItems: 'center',
                          borderWidth: 2,
                          borderStyle: 'dashed',
                          borderColor: themeColors.border,
                        }}>
                        <View className="flex-row items-center">
                          <Icon
                            name="plus"
                            size={20}
                            color={themeColors.text.tertiary}
                          />
                          <ThemedText
                            variant="secondary"
                            weight="medium"
                            style={{marginLeft: 8}}>
                            Add Another Person
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </ScrollView>

              {/* Footer Buttons */}
              <View
                style={{
                  padding: 16,
                  borderTopWidth: 1,
                  borderTopColor: themeColors.border,
                }}>
                <View style={{flexDirection: 'row', gap: 12}}>
                  {editMode ? (
                    // Edit Mode: Only Cancel and Update buttons
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          resetForm();
                          onClose();
                        }}
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
                        onPress={handleSave}
                        disabled={loading}
                        style={{
                          flex: 1,
                          paddingVertical: 16,
                          borderRadius: 12,
                          alignItems: 'center',
                          backgroundColor: loading
                            ? themeColors.surfaceVariant
                            : RentAppColors.status.success,
                        }}>
                        {loading ? (
                          <View className="flex-row items-center">
                            <ActivityIndicator size="small" color="white" />
                            <ThemedText
                              size="base"
                              weight="semibold"
                              style={{marginLeft: 8, color: '#FFFFFF'}}>
                              Updating...
                            </ThemedText>
                          </View>
                        ) : (
                          <ThemedText
                            size="base"
                            weight="semibold"
                            style={{color: '#FFFFFF'}}>
                            Update Details
                          </ThemedText>
                        )}
                      </TouchableOpacity>
                    </>
                  ) : currentStep === 1 ? (
                    // Add Mode: Step 1 buttons
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          resetForm();
                          onClose();
                        }}
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
                        onPress={nextStep}
                        style={{
                          flex: 1,
                          backgroundColor: RentAppColors.primary[500],
                          paddingVertical: 16,
                          borderRadius: 12,
                          alignItems: 'center',
                        }}>
                        <View className="flex-row items-center">
                          <ThemedText
                            size="base"
                            weight="semibold"
                            style={{marginRight: 8, color: '#FFFFFF'}}>
                            Next
                          </ThemedText>
                          <Icon name="arrow-right" size={16} color="white" />
                        </View>
                      </TouchableOpacity>
                    </>
                  ) : (
                    // Add Mode: Step 2 buttons
                    <>
                      <TouchableOpacity
                        onPress={prevStep}
                        style={{
                          flex: 1,
                          backgroundColor: themeColors.surfaceVariant,
                          paddingVertical: 16,
                          borderRadius: 12,
                          alignItems: 'center',
                        }}>
                        <View className="flex-row items-center">
                          <Icon
                            name="arrow-left"
                            size={16}
                            color={isDark ? '#FFFFFF' : '#374151'}
                          />
                          <ThemedText
                            size="base"
                            weight="semibold"
                            style={{marginLeft: 8}}>
                            Back
                          </ThemedText>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading}
                        style={{
                          flex: 1,
                          paddingVertical: 16,
                          borderRadius: 12,
                          alignItems: 'center',
                          backgroundColor: loading
                            ? themeColors.surfaceVariant
                            : RentAppColors.status.success,
                        }}>
                        {loading ? (
                          <View className="flex-row items-center">
                            <ActivityIndicator size="small" color="white" />
                            <ThemedText
                              size="base"
                              weight="semibold"
                              style={{marginLeft: 8, color: '#FFFFFF'}}>
                              Saving...
                            </ThemedText>
                          </View>
                        ) : (
                          <View className="flex-row items-center">
                            <Icon name="check" size={16} color="white" />
                            <ThemedText
                              size="base"
                              weight="semibold"
                              style={{marginLeft: 8, color: '#FFFFFF'}}>
                              Save Tenant
                            </ThemedText>
                          </View>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Date Pickers */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleStartDateConfirm}
        onCancel={hideDatePicker}
      />

      <DateTimePickerModal
        isVisible={isDatePickerVisibleDOB}
        mode="date"
        onConfirm={handleDOBConfirm}
        onCancel={hideDatePickerDOB}
      />
    </Modal>
  );
};

export default AddNewTenant;
