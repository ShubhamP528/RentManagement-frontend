import React, {useCallback, useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AddNewTenant from '../component/AddNewTenant';
import {useFocusEffect} from '@react-navigation/native';
import CustomHeader from '../component/CustomHeader';
import {RentAppColors, getRentThemeColors} from '../constants/colors';
import {useTheme} from '../contexts/ThemeContext';
import {ThemedText} from '../component/ThemedText';
import {createThemedStyles} from '../styles/theme';

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
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editLoading, setEditLoading] = useState<boolean>(false);

  const roomId = route.params.roomId;
  const {isDark} = useTheme();
  const themeColors = getRentThemeColors(isDark);
  const styles = createThemedStyles(isDark);

  // Hide default header
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const onSave = async (obj: any) => {
    console.log(obj);
    setAddLoading(true);
    try {
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
        const resp = await addNewTenant.json();
        console.log(resp);
        throw new Error('Failed to add new tenant');
      }

      Alert.alert('Success', 'Tenant added successfully! 🎉');
      setShowModel(false);
      getRoomDetails();
    } catch (error) {
      console.error('Failed to add new tenant:', error);
      Alert.alert('Error', 'Failed to add new tenant. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  const getRoomDetails = React.useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoading(true);
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
          setRefreshing(false);
          Alert.alert(
            'Error',
            'Failed to fetch room details. Please try again.',
          );
          return;
        }
        const data = await response.json();
        setLoading(false);
        setRefreshing(false);
        setTenants(data.tenant.reverse());

        // Animate content
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
        setLoading(false);
        setRefreshing(false);
        console.error('Error:', error);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    },
    [roomId, currentUser, fadeAnim, slideAnim],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getRoomDetails(true);
  }, [getRoomDetails]);

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

  const formatPersonsForEdit = (tenant: Tenant) => {
    const persons = [];

    // Add head person
    if (tenant.headPerson) {
      persons.push({
        name: tenant.headPerson.name || '',
        dob: tenant.headPerson.dob || '',
        email: tenant.headPerson.email || '',
        phoneNumber: tenant.headPerson.phoneNumber || '',
        gender: tenant.headPerson.gender || '',
        isHead: true,
        relation: {
          relationWith: tenant.headPerson.relation?.relationWith || null,
          relationType: tenant.headPerson.relation?.relationType || '',
        },
      });
    }

    // Add other persons
    if (tenant.Persons && tenant.Persons.length > 0) {
      tenant.Persons.forEach(person => {
        if (!person.isHead) {
          persons.push({
            name: person.name || '',
            dob: person.dob || '',
            email: person.email || '',
            phoneNumber: person.phoneNumber || '',
            gender: person.gender || '',
            isHead: false,
            relation: {
              relationWith: person.relation?.relationWith || null,
              relationType: person.relation?.relationType || '',
            },
          });
        }
      });
    }

    return persons;
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setShowEditModal(true);
  };

  const handleUpdateTenant = async (data: {
    personsData: any[];
    tenantData: any;
  }) => {
    if (!editingTenant) return;

    try {
      setEditLoading(true);

      const response = await fetch(
        `${NODE_API_ENDPOINT}/tenant/editTenant/${roomId}/${editingTenant._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser?.token}`,
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update tenant details');
      }

      const result = await response.json();
      // refresh this screen
      getRoomDetails();

      Alert.alert('Success', 'Tenant details updated successfully! 🎉');
      setShowEditModal(false);
      setEditingTenant(null);
    } catch (error) {
      console.error('Error updating tenant:', error);
      Alert.alert(
        'Error',
        'Failed to update tenant details. Please try again.',
      );
    } finally {
      setEditLoading(false);
    }
  };

  const capitalizeFirstLetter = (str: string) =>
    str?.charAt(0).toUpperCase() + str?.slice(1) || '';

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: themeColors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View style={{alignItems: 'center'}}>
          <ActivityIndicator size="large" color={RentAppColors.primary[500]} />
          <Text
            style={{
              color: themeColors.text.secondary,
              marginTop: 16,
              fontSize: 16,
            }}>
            Loading tenant details...
          </Text>
        </View>
      </View>
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

  const renderTenantCard = ({item}: {item: Tenant}) => {
    const isCurrentTenant = item.endDate === null;
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
          width: screenWidth * 0.9,
          marginHorizontal: screenWidth * 0.05,
          shadowColor: RentAppColors.primary[900],
          shadowOffset: {width: 0, height: 8},
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 10,
          backgroundColor: themeColors.surface,
          borderRadius: 24,
          marginVertical: 16,
        }}>
        {/* Header Section */}
        <View
          style={{
            padding: 24,
            borderBottomWidth: 1,
            borderBottomColor: themeColors.border,
          }}>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                  backgroundColor: isCurrentTenant
                    ? isDark
                      ? RentAppColors.status.success + '30'
                      : RentAppColors.status.success + '20'
                    : themeColors.surfaceVariant,
                }}>
                <Icon
                  name={isCurrentTenant ? 'account-check' : 'account-clock'}
                  size={28}
                  color={
                    isCurrentTenant
                      ? RentAppColors.status.success
                      : themeColors.text.secondary
                  }
                />
              </View>
              <View className="flex-1">
                <ThemedText size="2xl" weight="bold" style={{marginBottom: 4}}>
                  {item.headPerson?.name || 'Unknown Tenant'}
                </ThemedText>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 20,
                    backgroundColor: isCurrentTenant
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
                      color: isCurrentTenant
                        ? RentAppColors.status.success
                        : RentAppColors.status.error,
                    }}>
                    {isCurrentTenant ? '🟢 Current Tenant' : '🔴 Past Tenant'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Menu */}
            <Menu renderer={renderers.ContextMenu}>
              <MenuTrigger>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: themeColors.surfaceVariant,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Icon
                    name="dots-vertical"
                    size={20}
                    color={themeColors.text.tertiary}
                  />
                </View>
              </MenuTrigger>
              <MenuOptions
                customStyles={{
                  optionsContainer: {
                    padding: 8,
                    backgroundColor: themeColors.surface,
                    borderRadius: 12,
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 4},
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 8,
                  },
                }}>
                {isCurrentTenant && (
                  <>
                    <MenuOption onSelect={() => handleEditTenant(item)}>
                      <View className="flex-row items-center py-2">
                        <Icon
                          name="account-edit"
                          size={18}
                          color={RentAppColors.status.success}
                        />
                        <ThemedText
                          weight="medium"
                          style={{
                            marginLeft: 8,
                            color: RentAppColors.status.success,
                          }}>
                          Edit Tenant Details
                        </ThemedText>
                      </View>
                    </MenuOption>
                    <MenuOption
                      onSelect={() => {
                        Alert.alert(
                          'Mark Tenant as Left',
                          `Are you sure you want to mark ${item.headPerson?.name} as left?`,
                          [
                            {text: 'Cancel', style: 'cancel'},
                            {
                              text: 'Yes, Mark as Left',
                              style: 'destructive',
                              onPress: () => markAsLeft(item._id),
                            },
                          ],
                        );
                      }}>
                      <View className="flex-row items-center py-2">
                        <Icon
                          name="exit-to-app"
                          size={18}
                          color={RentAppColors.status.error}
                        />
                        <ThemedText
                          weight="medium"
                          style={{
                            marginLeft: 8,
                            color: RentAppColors.status.error,
                          }}>
                          Mark as Left
                        </ThemedText>
                      </View>
                    </MenuOption>
                  </>
                )}
                <MenuOption
                  onSelect={() =>
                    navigation.push('TransactionDetails', {
                      tenantId: item._id,
                      roomId,
                      previousReading: item.finalReading,
                    })
                  }>
                  <View className="flex-row items-center py-2">
                    <Icon
                      name="receipt"
                      size={18}
                      color={RentAppColors.primary[500]}
                    />
                    <ThemedText
                      weight="medium"
                      style={{
                        marginLeft: 8,
                        color: RentAppColors.primary[500],
                      }}>
                      View Transactions
                    </ThemedText>
                  </View>
                </MenuOption>
              </MenuOptions>
            </Menu>
          </View>

          {/* Date Information */}
          <View className="flex-row items-center mb-4">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Icon
                  name="calendar-start"
                  size={16}
                  color={themeColors.text.tertiary}
                />
                <ThemedText
                  variant="secondary"
                  size="sm"
                  weight="medium"
                  style={{marginLeft: 8}}>
                  Started: {formatDate(item.startDate)}
                </ThemedText>
              </View>
              {item.endDate && (
                <View className="flex-row items-center">
                  <Icon
                    name="calendar-end"
                    size={16}
                    color={themeColors.text.tertiary}
                  />
                  <ThemedText
                    variant="secondary"
                    size="sm"
                    weight="medium"
                    style={{marginLeft: 8}}>
                    Ended: {formatDate(item.endDate)}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 20}}>
          {/* Financial Information */}
          <View className="p-6">
            <ThemedText size="lg" weight="bold" style={{marginBottom: 16}}>
              Financial Details
            </ThemedText>

            <View className="space-y-3">
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isDark
                    ? RentAppColors.primary[900] + '40'
                    : RentAppColors.primary[100],
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 8,
                }}>
                <View className="flex-row items-center">
                  <Icon
                    name="currency-inr"
                    size={20}
                    color={RentAppColors.primary[500]}
                  />
                  <ThemedText
                    variant="tertiary"
                    weight="medium"
                    style={{marginLeft: 8}}>
                    Monthly Rent
                  </ThemedText>
                </View>
                <ThemedText
                  size="lg"
                  weight="bold"
                  style={{color: RentAppColors.primary[600]}}>
                  ₹{item.Rent?.toLocaleString() || 0}
                </ThemedText>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: isDark
                    ? RentAppColors.status.success + '30'
                    : RentAppColors.status.success + '20',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 8,
                }}>
                <View className="flex-row items-center">
                  <Icon
                    name="cash-plus"
                    size={20}
                    color={RentAppColors.status.success}
                  />
                  <ThemedText
                    variant="tertiary"
                    weight="medium"
                    style={{marginLeft: 8}}>
                    Advance Amount
                  </ThemedText>
                </View>
                <ThemedText
                  size="lg"
                  weight="bold"
                  style={{color: RentAppColors.status.success}}>
                  ₹{item.AdvanceMoney?.toLocaleString() || 0}
                </ThemedText>
              </View>

              {(item.PendingMoney || 0) > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isDark
                      ? RentAppColors.status.error + '30'
                      : RentAppColors.status.error + '20',
                    padding: 16,
                    borderRadius: 12,
                  }}>
                  <View className="flex-row items-center">
                    <Icon
                      name="alert-circle"
                      size={20}
                      color={RentAppColors.status.error}
                    />
                    <ThemedText
                      variant="tertiary"
                      weight="medium"
                      style={{marginLeft: 8}}>
                      Pending Amount
                    </ThemedText>
                  </View>
                  <ThemedText
                    size="lg"
                    weight="bold"
                    style={{color: RentAppColors.status.error}}>
                    ₹{item.PendingMoney?.toLocaleString() || 0}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Family Members */}
          {item.Persons && item.Persons.length > 0 && (
            <View className="px-6 pb-6">
              <ThemedText size="lg" weight="bold" style={{marginBottom: 16}}>
                Family Members ({item.Persons.length})
              </ThemedText>

              {item.Persons.map((person, index) => (
                <View
                  key={person._id || index}
                  className=" rounded-xl p-4 mb-3"
                  style={{backgroundColor: themeColors.background}}>
                  <View className="flex-row items-center mb-3">
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
                            ? RentAppColors.primary[900] + '40'
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
                    <View className="flex-1">
                      <ThemedText variant="primary" size="lg" weight="bold">
                        {person.name}
                        {person.isHead && (
                          <ThemedText
                            size="sm"
                            weight="medium"
                            style={{color: RentAppColors.primary[600]}}>
                            {' '}
                            (Head)
                          </ThemedText>
                        )}
                      </ThemedText>
                    </View>
                  </View>

                  <View className="space-y-2">
                    <View className="flex-row items-center">
                      <Icon
                        name="gender-male-female"
                        size={14}
                        color={themeColors.text.tertiary}
                      />
                      <ThemedText
                        variant="tertiary"
                        size="sm"
                        style={{marginLeft: 8}}>
                        {capitalizeFirstLetter(
                          person.gender || 'Not specified',
                        )}
                      </ThemedText>
                    </View>

                    <View className="flex-row items-center">
                      <Icon
                        name="cake-variant"
                        size={14}
                        color={themeColors.text.tertiary}
                      />
                      <ThemedText
                        variant="tertiary"
                        size="sm"
                        style={{marginLeft: 8}}>
                        {person.dob
                          ? new Date(person.dob).toLocaleDateString()
                          : 'Not specified'}
                      </ThemedText>
                    </View>

                    {person.email && (
                      <View className="flex-row items-center">
                        <Icon
                          name="email"
                          size={14}
                          color={themeColors.text.tertiary}
                        />
                        <ThemedText
                          variant="tertiary"
                          size="sm"
                          style={{marginLeft: 8}}>
                          {person.email}
                        </ThemedText>
                      </View>
                    )}

                    {person.phoneNumber && (
                      <View className="flex-row items-center">
                        <Icon
                          name="phone"
                          size={14}
                          color={themeColors.text.tertiary}
                        />
                        <ThemedText
                          variant="tertiary"
                          size="sm"
                          style={{marginLeft: 8}}>
                          {person.phoneNumber}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    );
  };

  console.log(tenants);
  console.log(tenants.find(item => item.endDate === null));

  const currentTenant = tenants.find(item => item.endDate === null);

  return (
    <View style={{flex: 1, backgroundColor: themeColors.background}}>
      <CustomHeader title="Room Tenants" subtitle="Managing" />
      {/* Statistics Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 16,
          backgroundColor: themeColors.surface,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border,
        }}>
        <View className="flex-row items-center justify-between">
          <View>
            <ThemedText size="2xl" weight="bold">
              Room Tenants
            </ThemedText>
            <ThemedText variant="secondary">
              {tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'}{' '}
              total
            </ThemedText>
          </View>
          {!currentTenant && (
            <TouchableOpacity
              onPress={() => setShowModel(true)}
              className="bg-blue-500 px-4 py-2 rounded-xl flex-row items-center">
              <Icon name="plus" size={16} color="white" />
              <ThemedText
                weight="medium"
                style={{marginLeft: 4, color: 'white'}}>
                Add Tenant
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* No Tenants Found Message */}
      {!loading && tenants.length === 0 ? (
        <ScrollView
          contentContainerStyle={{flexGrow: 1}}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[RentAppColors.primary[500]]}
              tintColor={RentAppColors.primary[500]}
            />
          }>
          <View className="flex-1 items-center justify-center px-8 py-16">
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
                name="account-plus"
                size={40}
                color={themeColors.text.tertiary}
              />
            </View>
            <ThemedText
              size="xl"
              weight="semibold"
              style={{marginBottom: 8, textAlign: 'center'}}>
              No Tenants Yet
            </ThemedText>
            <ThemedText
              variant="secondary"
              style={{textAlign: 'center', marginBottom: 32, lineHeight: 24}}>
              This room doesn't have any tenants yet. Add the first tenant to
              start managing this room.
            </ThemedText>
            <TouchableOpacity
              onPress={() => setShowModel(true)}
              className="bg-blue-500 px-6 py-3 rounded-xl flex-row items-center">
              <Icon name="plus" size={20} color="white" />
              <ThemedText
                weight="semibold"
                style={{marginLeft: 8, color: 'white'}}>
                Add First Tenant
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <>
          {/* Tenant Cards */}
          <FlatList
            data={tenants}
            renderItem={renderTenantCard}
            keyExtractor={item => item._id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[RentAppColors.primary[500]]}
                tintColor={RentAppColors.primary[500]}
              />
            }
            contentContainerStyle={{paddingVertical: 8}}
          />

          {/* Pagination Dots */}
          {tenants.length > 1 && (
            <View className="flex-row justify-center py-4">
              {tenants.map((_, idx) => (
                <View
                  key={idx}
                  className={`w-2 h-2 rounded-full mx-1 ${
                    idx === currentIndex
                      ? 'bg-blue-500'
                      : themeColors.surfaceVariant
                  }`}
                />
              ))}
            </View>
          )}

          {/* Current Tenant Status */}
          {currentTenant && (
            <View className="px-6 pb-4">
              <View
                style={{
                  backgroundColor: isDark
                    ? RentAppColors.status.success + '30'
                    : RentAppColors.status.success + '20',
                  padding: 16,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <Icon
                  name="check-circle"
                  size={20}
                  color={RentAppColors.status.success}
                />
                <ThemedText
                  weight="medium"
                  style={{
                    marginLeft: 8,
                    color: RentAppColors.status.success,
                    flexShrink: 1,
                  }}>
                  Room is currently occupied by {currentTenant.headPerson?.name}
                </ThemedText>
              </View>
            </View>
          )}
        </>
      )}

      {/* Floating Action Button */}
      {!currentTenant && tenants.length > 0 && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 bg-blue-500 w-16 h-16 rounded-full items-center justify-center shadow-lg"
          style={{
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          onPress={() => setShowModel(true)}
          activeOpacity={0.8}>
          <Icon name="plus" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Loading Overlay */}
      {markingAsLeft && (
        <View className="absolute inset-0 bg-black bg-opacity-50 items-center justify-center z-50">
          <View
            style={{
              backgroundColor: themeColors.surface,
              padding: 24,
              borderRadius: 16,
              alignItems: 'center',
            }}>
            <ActivityIndicator
              size="large"
              color={RentAppColors.primary[500]}
            />
            <ThemedText weight="medium" style={{marginTop: 16}}>
              Marking tenant as left...
            </ThemedText>
          </View>
        </View>
      )}

      <AddNewTenant
        loading={addLoading}
        visible={showModel}
        onClose={() => setShowModel(false)}
        onSave={onSave}
      />

      <AddNewTenant
        loading={editLoading}
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTenant(null);
        }}
        onSave={handleUpdateTenant}
        editMode={true}
        initialPersonsData={
          editingTenant ? formatPersonsForEdit(editingTenant) : []
        }
        initialTenantData={
          editingTenant
            ? {
                startDate: editingTenant.startDate,
                endDate: editingTenant.endDate,
                Rent: editingTenant.Rent?.toString() || '',
                initialReading: editingTenant.initialReading?.toString() || '',
              }
            : undefined
        }
      />
    </View>
  );
};

export default TenantCarousel;
