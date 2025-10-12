import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState, useCallback, useLayoutEffect, useRef} from 'react';
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
  Animated,
  RefreshControl,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RootStackParamList} from '../stacks/Home';
import {NODE_API_ENDPOINT} from '../constants';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../redux/store';
import {useFocusEffect} from '@react-navigation/native';
import {logout} from '../redux/authSlice';
import CustomHeader from '../component/CustomHeader';
import {RentAppColors, getRentThemeColors} from '../constants/colors';
import {useTheme} from '../contexts/ThemeContext';
import {ThemeToggle} from '../component/ThemeToggle';
import {ThemedText} from '../component/ThemedText';

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

  const [loading, setLoading] = useState<boolean>(true);
  const [AddLoading, setAddLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const {isDark} = useTheme();
  const themeColors = getRentThemeColors(isDark);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const getAllProperties = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoading(true);
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
          setRefreshing(false);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        console.log(data.properties);

        setProperties(data.properties);
        setLoading(false);
        setRefreshing(false);

        // Animate list items
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentUser?.token, fadeAnim, slideAnim],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getAllProperties(true);
  }, [getAllProperties]);

  // Re-fetch property details when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (currentUser?.token) {
        getAllProperties();
      }
    }, [getAllProperties, currentUser?.token]),
  );

  // Filter properties based on search query
  const filteredProperties = properties.filter(
    property =>
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.locality
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      property.address.city.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!propertyName.trim()) {
      errors.propertyName = 'Property name is required';
    }

    if (!address.address.trim()) {
      errors.address = 'Street address is required';
    }

    if (!address.city.trim()) {
      errors.city = 'City is required';
    }

    if (!address.state.trim()) {
      errors.state = 'State is required';
    }

    if (!address.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(address.pincode)) {
      errors.pincode = 'Pincode must be 6 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addProperty = async () => {
    if (!validateForm()) {
      Alert.alert(
        'Validation Error',
        'Please fill in all required fields correctly.',
      );
      return;
    }

    try {
      setAddLoading(true);
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
      Alert.alert('Success', 'Property added successfully! 🎉');
      resetForm();
      setModalVisible(false);

      // Update the properties list with the new property
      setProperties([...properties, data]);
    } catch (error) {
      setAddLoading(false);
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to add property. Please try again.');
    }
  };

  const resetForm = () => {
    setPropertyName('');
    setAddress({
      pincode: '',
      locality: '',
      address: '',
      city: '',
      state: '',
      landmark: '',
    });
    setCurrentStep(1);
    setFocusedField(null);
    setFormErrors({});
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!propertyName.trim()) {
        setFormErrors({propertyName: 'Property name is required'});
        return;
      }
      setFormErrors({});
    }
    setCurrentStep(prev => Math.min(prev + 1, 2));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleOpenProperty = (property: string) => {
    navigation.push('PropertyDetail', {propertyId: property});
  };

  const dispatch = useDispatch();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
          navigation.replace('Login');
        },
      },
    ]);
  };

  // Hide default header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: themeColors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View className="items-center">
          <ActivityIndicator size="large" color={RentAppColors.primary[500]} />
          <ThemedText variant="secondary" style={{marginTop: 16, fontSize: 16}}>
            Loading properties...
          </ThemedText>
        </View>
      </View>
    );
  }

  const renderPropertyCard = ({item}: {item: Property}) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{translateY: slideAnim}],
      }}>
      <Pressable
        onPress={() => handleOpenProperty(item._id)}
        style={{
          backgroundColor: themeColors.surface,
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 20,
          shadowColor: RentAppColors.primary[900],
          shadowOffset: {width: 0, height: 6},
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
          borderWidth: 1,
          borderColor: themeColors.border,
        }}>
        <View style={{padding: 24}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
            }}>
            <View
              style={{
                width: 56,
                height: 56,
                backgroundColor: RentAppColors.primary[100],
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}>
              <Icon
                name="home-variant"
                size={28}
                color={RentAppColors.primary[600]}
              />
            </View>
            <View style={{flex: 1}}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: themeColors.text.primary,
                  marginBottom: 4,
                }}>
                {item.name}
              </Text>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icon
                  name="map-marker"
                  size={16}
                  color={RentAppColors.secondary[500]}
                />
                <Text
                  style={{
                    color: themeColors.text.secondary,
                    marginLeft: 6,
                    flex: 1,
                    fontSize: 14,
                  }}
                  numberOfLines={1}>
                  {item.address.locality}, {item.address.city}
                </Text>
              </View>
            </View>
            <Icon
              name="chevron-right"
              size={24}
              color={RentAppColors.primary[400]}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: themeColors.divider,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Icon name="door" size={18} color={RentAppColors.accent[500]} />
              <Text
                style={{
                  color: themeColors.text.secondary,
                  marginLeft: 8,
                  fontSize: 14,
                  fontWeight: '500',
                }}>
                {item.rooms.length} Rooms
              </Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Icon
                name="map-marker-outline"
                size={18}
                color={RentAppColors.secondary[500]}
              />
              <Text
                style={{
                  color: themeColors.text.secondary,
                  marginLeft: 8,
                  fontSize: 14,
                  fontWeight: '500',
                }}>
                {item.address.state}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8">
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
        <Icon name="home-plus-outline" size={40} color="#9CA3AF" />
      </View>
      <ThemedText
        size="xl"
        weight="semibold"
        style={{marginBottom: 8, textAlign: 'center'}}>
        No Properties Found
      </ThemedText>
      <ThemedText
        variant="secondary"
        style={{textAlign: 'center', marginBottom: 32, lineHeight: 24}}>
        {searchQuery
          ? `No properties match "${searchQuery}". Try a different search term.`
          : "You haven't added any properties yet. Tap the + button to add your first property."}
      </ThemedText>
      {!searchQuery && (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{
            backgroundColor: RentAppColors.primary[500],
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Icon name="plus" size={20} color="white" />
          <ThemedText weight="semibold" style={{marginLeft: 8, color: 'white'}}>
            Add Property
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={{flex: 1, backgroundColor: themeColors.background}}>
      {/* Custom Header */}
      <CustomHeader
        title="My Properties"
        subtitle="Managing"
        showBackButton={false}
        showHomeButton={false}
      />

      {/* Properties Section */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 16,
          backgroundColor: themeColors.surface,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border,
        }}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <ThemedText size="2xl" weight="bold">
              My Properties
            </ThemedText>
            <ThemedText variant="secondary">
              {properties.length}{' '}
              {properties.length === 1 ? 'property' : 'properties'} total
            </ThemedText>
          </View>
          <View className="flex-row items-center" style={{gap: 12}}>
            {/* <ThemeToggle size="medium" /> */}
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{
                backgroundColor: RentAppColors.primary[500],
                width: 48,
                height: 48,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon name="plus" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: themeColors.surfaceVariant,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}>
          <Icon name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 16,
              color: themeColors.text.primary,
            }}
            placeholder="Search properties..."
            placeholderTextColor={themeColors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Properties List */}
      {filteredProperties.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredProperties}
          keyExtractor={item => item._id}
          renderItem={renderPropertyCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingTop: 16, paddingBottom: 100}}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[RentAppColors.primary[500]]}
              tintColor="#3B82F6"
            />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          backgroundColor: RentAppColors.primary[500],
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: RentAppColors.primary[900],
          shadowOffset: {width: 0, height: 6},
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 10,
        }}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}>
        <Icon name="plus" size={32} color="white" />
      </TouchableOpacity>

      {/* Enhanced Step-by-Step Modal for Adding Property */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              paddingHorizontal: 16,
            }}>
            <View
              style={{
                backgroundColor: themeColors.surface,
                borderRadius: 24,
                maxHeight: '90%',
                minHeight: '70%',
              }}>
              {/* Modal Header with Progress */}
              <View
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: themeColors.border,
                }}>
                <View className="flex-row items-center justify-between mb-3">
                  <ThemedText size="xl" weight="bold">
                    Add New Property
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => {
                      resetForm();
                      setModalVisible(false);
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

                {/* Progress Indicator */}
                <View className="flex-row items-center mb-2">
                  <View className="flex-1 flex-row items-center">
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

                <View className="flex-row justify-between">
                  <ThemedText size="xs" variant="tertiary">
                    Basic Info
                  </ThemedText>
                  <ThemedText size="xs" variant="tertiary">
                    Address
                  </ThemedText>
                </View>
              </View>

              <ScrollView
                className="flex-1 px-6"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{flexGrow: 1, paddingBottom: 20}}>
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <View className="py-4">
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
                          marginBottom: 12,
                        }}>
                        <Icon name="home-plus" size={24} color="#3B82F6" />
                      </View>
                      <ThemedText
                        size="lg"
                        weight="semibold"
                        style={{marginBottom: 4}}>
                        Property Details
                      </ThemedText>
                      <ThemedText
                        variant="secondary"
                        style={{textAlign: 'center', fontSize: 14}}>
                        Let's start with basic information about your property
                      </ThemedText>
                    </View>

                    {/* Property Name */}
                    <View className="mb-6">
                      <ThemedText
                        size="sm"
                        weight="medium"
                        style={{marginBottom: 8}}>
                        Property Name *
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
                            focusedField === 'propertyName'
                              ? RentAppColors.primary[500]
                              : formErrors.propertyName
                              ? RentAppColors.status.error
                              : themeColors.border,
                        }}>
                        <Icon
                          name="home-variant-outline"
                          size={20}
                          color={
                            focusedField === 'propertyName'
                              ? '#3B82F6'
                              : '#9CA3AF'
                          }
                        />
                        <TextInput
                          style={{
                            flex: 1,
                            paddingVertical: 16,
                            paddingHorizontal: 12,
                            fontSize: 16,
                            color: themeColors.text.primary,
                          }}
                          placeholder="e.g., Sunset Apartments, Green Villa"
                          placeholderTextColor="#9CA3AF"
                          value={propertyName}
                          onChangeText={text => {
                            setPropertyName(text);
                            if (formErrors.propertyName) {
                              setFormErrors(prev => ({
                                ...prev,
                                propertyName: '',
                              }));
                            }
                          }}
                          onFocus={() => setFocusedField('propertyName')}
                          onBlur={() => setFocusedField(null)}
                        />
                      </View>
                      {formErrors.propertyName && (
                        <Text className="text-red-500 text-sm mt-1 ml-1">
                          {formErrors.propertyName}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Step 2: Address Information */}
                {currentStep === 2 && (
                  <View className="py-4">
                    <View className="items-center mb-6">
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          backgroundColor: isDark
                            ? RentAppColors.secondary[900] + '40'
                            : RentAppColors.secondary[100],
                          borderRadius: 16,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 12,
                        }}>
                        <Icon name="map-marker" size={24} color="#10B981" />
                      </View>
                      <ThemedText
                        size="lg"
                        weight="semibold"
                        style={{marginBottom: 4}}>
                        Address Details
                      </ThemedText>
                      <ThemedText
                        variant="secondary"
                        style={{textAlign: 'center', fontSize: 14}}>
                        Provide the complete address of your property
                      </ThemedText>
                    </View>

                    {/* Address Fields */}
                    {[
                      {
                        key: 'address',
                        label: 'Street Address',
                        icon: 'map-marker-outline',
                        placeholder: 'Enter street address',
                        required: true,
                      },
                      {
                        key: 'locality',
                        label: 'Locality/Area',
                        icon: 'map-outline',
                        placeholder: 'Enter locality or area',
                        required: false,
                      },
                      {
                        key: 'city',
                        label: 'City',
                        icon: 'city-variant-outline',
                        placeholder: 'Enter city',
                        required: true,
                      },
                      {
                        key: 'state',
                        label: 'State',
                        icon: 'map-legend',
                        placeholder: 'Enter state',
                        required: true,
                      },
                      {
                        key: 'pincode',
                        label: 'Pincode',
                        icon: 'numeric',
                        placeholder: 'Enter 6-digit pincode',
                        required: true,
                      },
                      {
                        key: 'landmark',
                        label: 'Landmark',
                        icon: 'map-marker-star-outline',
                        placeholder: 'Enter nearby landmark (optional)',
                        required: false,
                      },
                    ].map(({key, label, icon, placeholder, required}) => (
                      <View key={key} className="mb-4">
                        <ThemedText
                          size="sm"
                          weight="medium"
                          style={{marginBottom: 8}}>
                          {label} {required && '*'}
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
                              focusedField === key
                                ? RentAppColors.primary[500]
                                : formErrors[key]
                                ? RentAppColors.status.error
                                : themeColors.border,
                          }}>
                          <Icon
                            name={icon}
                            size={20}
                            color={focusedField === key ? '#3B82F6' : '#9CA3AF'}
                          />
                          <TextInput
                            style={{
                              flex: 1,
                              paddingVertical: 16,
                              paddingHorizontal: 12,
                              fontSize: 16,
                              color: themeColors.text.primary,
                            }}
                            placeholder={placeholder}
                            placeholderTextColor="#9CA3AF"
                            value={address[key as keyof Address]}
                            onChangeText={text => {
                              setAddress(prev => ({...prev, [key]: text}));
                              if (formErrors[key]) {
                                setFormErrors(prev => ({...prev, [key]: ''}));
                              }
                            }}
                            onFocus={() => setFocusedField(key)}
                            onBlur={() => setFocusedField(null)}
                            keyboardType={
                              key === 'pincode' ? 'numeric' : 'default'
                            }
                            maxLength={key === 'pincode' ? 6 : undefined}
                          />
                        </View>
                        {formErrors[key] && (
                          <Text className="text-red-500 text-sm mt-1 ml-1">
                            {formErrors[key]}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Enhanced Modal Footer */}
              <View
                style={{
                  padding: 16,
                  borderTopWidth: 1,
                  borderTopColor: themeColors.border,
                }}>
                <View className="flex-row" style={{gap: 16}}>
                  {currentStep === 1 ? (
                    <>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: themeColors.surfaceVariant,
                          paddingVertical: 16,
                          borderRadius: 12,
                          alignItems: 'center',
                        }}
                        onPress={() => {
                          resetForm();
                          setModalVisible(false);
                        }}>
                        <ThemedText size="base" weight="semibold">
                          Cancel
                        </ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-1 bg-blue-500 py-4 rounded-xl items-center"
                        onPress={nextStep}>
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
                    <>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: themeColors.surfaceVariant,
                          paddingVertical: 16,
                          borderRadius: 12,
                          alignItems: 'center',
                        }}
                        onPress={prevStep}>
                        <View className="flex-row items-center">
                          <Icon
                            name="arrow-left"
                            size={16}
                            color={themeColors.text.primary}
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
                        disabled={AddLoading}
                        style={{
                          flex: 1,
                          paddingVertical: 16,
                          borderRadius: 12,
                          alignItems: 'center',
                          backgroundColor: AddLoading
                            ? themeColors.surfaceVariant
                            : RentAppColors.status.success,
                        }}
                        onPress={addProperty}>
                        {AddLoading ? (
                          <View className="flex-row items-center">
                            <ActivityIndicator size="small" color="white" />
                            <ThemedText
                              size="base"
                              weight="semibold"
                              style={{marginLeft: 8, color: '#FFFFFF'}}>
                              Creating...
                            </ThemedText>
                          </View>
                        ) : (
                          <View className="flex-row items-center">
                            <Icon name="check" size={16} color="white" />
                            <ThemedText
                              size="base"
                              weight="semibold"
                              style={{marginLeft: 8, color: '#FFFFFF'}}>
                              Create Property
                            </ThemedText>
                          </View>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default PropertyListScreen;
