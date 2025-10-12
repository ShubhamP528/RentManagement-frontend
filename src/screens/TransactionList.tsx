import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../stacks/Home';
import {NODE_API_ENDPOINT} from '../constants';
import {useSelector} from 'react-redux';
import {RootState} from '../redux/store';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DatePicker from 'react-native-date-picker';
import CustomHeader from '../component/CustomHeader';
import {RentAppColors, getRentThemeColors} from '../constants/colors';
import {useTheme} from '../contexts/ThemeContext';
import {ThemedText} from '../component/ThemedText';
import {createThemedStyles} from '../styles/theme';

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

const TransactionList = ({route, navigation}: TransactionListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [DOP, setDOP] = useState(new Date());
  const [MOP, setMOP] = useState('');
  const [RoomRent, setRoomRent] = useState('');
  const [currentReading, setCurrentReading] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [addLoading, setAddLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const status = 'Paid';
  const {isDark} = useTheme();
  const themeColors = getRentThemeColors(isDark);
  const styles = createThemedStyles(isDark);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const {tenantId, roomId, previousReading} = route.params;

  // Hide default header - must be called before any early returns
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const fetchTransactions = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoading(true);
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
          setRefreshing(false);
          Alert.alert(
            'Error',
            'Failed to fetch transactions. Please try again.',
          );
          return;
        }
        const data = await response.json();
        setTransactions(data.transaction);
        setLoading(false);
        setRefreshing(false);

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
        Alert.alert('Error', 'An error occurred while fetching transactions.');
        console.error('Error:', error);
      }
    },
    [currentUser?.token, tenantId, fadeAnim, slideAnim],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions(true);
  }, [fetchTransactions]);

  useEffect(() => {
    if (currentUser) {
      fetchTransactions();
    }
  }, [currentUser, fetchTransactions]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!MOP.trim()) {
      errors.MOP = 'Month of payment is required';
    }

    if (!RoomRent.trim()) {
      errors.RoomRent = 'Room rent is required';
    } else if (isNaN(Number(RoomRent)) || Number(RoomRent) <= 0) {
      errors.RoomRent = 'Please enter a valid rent amount';
    }

    if (!currentReading.trim()) {
      errors.currentReading = 'Current reading is required';
    } else if (isNaN(Number(currentReading))) {
      errors.currentReading = 'Please enter a valid reading';
    } else if (Number(currentReading) < Number(previousReading)) {
      errors.currentReading =
        'Current reading must be greater than previous reading';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddPayment = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      room: roomId,
      tenant: tenantId,
      DOP,
      MOP: MOP.trim(),
      RoomRent: Number(RoomRent),
      currentReading: Number(currentReading),
      previousReading: Number(previousReading),
      BuildReading: Number(currentReading) - Number(previousReading),
      Bill: (Number(currentReading) - Number(previousReading)) * 7,
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
        throw new Error('Failed to add payment');
      }

      const transec = await response.json();
      Alert.alert('Success', 'Payment added successfully! 🎉');

      setTransactions([...transactions, transec.payment]);
      resetForm();
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to add payment. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  const resetForm = () => {
    setDOP(new Date());
    setMOP('');
    setRoomRent('');
    setCurrentReading('');
    setFormErrors({});
    setFocusedField(null);
  };

  const getTotalAmount = () => {
    return transactions.reduce(
      (sum, transaction) => sum + transaction.totalAmount,
      0,
    );
  };

  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.DOP);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    return {
      thisMonth: thisMonthTransactions.length,
      thisMonthAmount: thisMonthTransactions.reduce(
        (sum, t) => sum + t.totalAmount,
        0,
      ),
      total: transactions.length,
      totalAmount: getTotalAmount(),
    };
  };

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
            Loading transactions...
          </Text>
        </View>
      </View>
    );
  }

  const renderTransaction = ({
    item,
    index,
  }: {
    item: Transaction;
    index: number;
  }) => {
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
        }}>
        <View
          style={{
            backgroundColor: themeColors.surface,
            marginHorizontal: 16,
            marginBottom: 16,
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}>
          {/* Header */}
          <View
            style={{
              padding: 20,
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
              <View
                className="flex-row items-center"
                style={{flex: 1, marginRight: 12}}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: RentAppColors.secondary[100],
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Icon
                    name="check-circle"
                    size={24}
                    color={RentAppColors.status.success}
                  />
                </View>
                <View style={{flex: 1}}>
                  <ThemedText size="lg" weight="bold" numberOfLines={1}>
                    {item.MOP} Payment
                  </ThemedText>
                  <ThemedText variant="secondary" size="sm">
                    {formatDate(item.DOP)}
                  </ThemedText>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: RentAppColors.secondary[100],
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 20,
                  minWidth: 60,
                  alignItems: 'center',
                }}>
                <ThemedText
                  size="sm"
                  weight="semibold"
                  style={{color: RentAppColors.status.success}}>
                  {item.status}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Payment Details */}
          <View className="p-5">
            <ThemedText
              size="base"
              weight="semibold"
              style={{marginBottom: 16}}>
              Payment Breakdown
            </ThemedText>

            <View className="space-y-3">
              {/* Room Rent */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: RentAppColors.primary[50],
                  padding: 12,
                  borderRadius: 12,
                }}
                className="mb-2">
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Icon
                    name="home"
                    size={18}
                    color={RentAppColors.primary[500]}
                  />
                  <Text
                    style={{
                      color: 'black',
                      marginLeft: 8,
                      fontWeight: '500',
                    }}>
                    Room Rent
                  </Text>
                </View>
                <ThemedText
                  weight="bold"
                  style={{color: RentAppColors.primary[600]}}>
                  ₹{item.RoomRent?.toLocaleString()}
                </ThemedText>
              </View>

              {/* Electricity Details */}
              <View
                style={{
                  backgroundColor: RentAppColors.accent[50],
                  padding: 12,
                  borderRadius: 12,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Icon
                      name="lightning-bolt"
                      size={18}
                      color={RentAppColors.status.warning}
                    />
                    <ThemedText
                      weight="medium"
                      style={{marginLeft: 8, color: 'black'}}>
                      Electricity Bill
                    </ThemedText>
                  </View>
                  <ThemedText
                    weight="bold"
                    style={{color: RentAppColors.status.warning}}>
                    ₹{item.Bill?.toLocaleString()}
                  </ThemedText>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: isDark
                      ? RentAppColors.status.warning + '40'
                      : RentAppColors.status.warning + '20',
                  }}>
                  <ThemedText variant="tertiary" size="sm">
                    {item.previousReading} → {item.currentReading} units
                  </ThemedText>
                  <ThemedText variant="tertiary" size="sm" weight="medium">
                    {item.BuildReading} units consumed
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Total Amount */}
            <View
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: themeColors.border,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: themeColors.surfaceVariant,
                  padding: 16,
                  borderRadius: 12,
                }}>
                <ThemedText size="lg" weight="bold">
                  Total Amount
                </ThemedText>
                <ThemedText
                  size="2xl"
                  weight="bold"
                  style={{color: RentAppColors.status.success}}>
                  ₹{item.totalAmount?.toLocaleString()}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const stats = getMonthlyStats();

  return (
    <View style={{flex: 1, backgroundColor: themeColors.background}}>
      <CustomHeader title="Payment History" subtitle="Viewing" />

      {/* Statistics Section */}
      <View
        style={{
          backgroundColor: themeColors.surface,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border,
        }}>
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <ThemedText size="2xl" weight="bold">
                Transactions
              </ThemedText>
              <ThemedText variant="secondary">
                {transactions.length}{' '}
                {transactions.length === 1 ? 'payment' : 'payments'} total
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              style={{
                backgroundColor: RentAppColors.primary[500],
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Icon name="plus" size={16} color="white" />
              <ThemedText
                weight="medium"
                style={{marginLeft: 4, color: 'white'}}>
                Add Payment
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Statistics Cards */}
          <View className="flex-row" style={{gap: 12}}>
            <View
              style={{
                flex: 1,
                backgroundColor: RentAppColors.primary[50],
                borderRadius: 12,
                padding: 16,
              }}>
              <View className="flex-row items-center justify-between">
                <View>
                  <ThemedText
                    size="2xl"
                    weight="bold"
                    style={{color: RentAppColors.primary[600]}}>
                    {stats.thisMonth}
                  </ThemedText>
                  <ThemedText
                    size="sm"
                    weight="medium"
                    style={{color: RentAppColors.primary[600]}}>
                    This Month
                  </ThemedText>
                </View>
                <Icon
                  name="calendar-month"
                  size={24}
                  color={RentAppColors.primary[500]}
                />
              </View>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: RentAppColors.secondary[50],
                borderRadius: 12,
                padding: 16,
              }}>
              <View className="flex-row items-center justify-between">
                <View>
                  <ThemedText
                    size="lg"
                    weight="bold"
                    style={{color: RentAppColors.status.success}}>
                    ₹{stats.totalAmount.toLocaleString()}
                  </ThemedText>
                  <ThemedText
                    size="sm"
                    weight="medium"
                    style={{color: RentAppColors.status.success}}>
                    Total Paid
                  </ThemedText>
                </View>
                <Icon
                  name="cash-multiple"
                  size={24}
                  color={RentAppColors.status.success}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Transactions List */}
      {!loading && transactions.length === 0 ? (
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
              <Icon name="receipt-outline" size={40} color="#9CA3AF" />
            </View>
            <ThemedText
              size="xl"
              weight="semibold"
              style={{marginBottom: 8, textAlign: 'center'}}>
              No Transactions Yet
            </ThemedText>
            <ThemedText
              variant="secondary"
              style={{textAlign: 'center', marginBottom: 32, lineHeight: 24}}>
              No payment records found. Add the first payment to start tracking
              transactions.
            </ThemedText>
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              className="bg-blue-500 px-6 py-3 rounded-xl flex-row items-center">
              <Icon name="plus" size={20} color="white" />
              <ThemedText
                weight="semibold"
                style={{marginLeft: 8, color: '#FFFFFF'}}>
                Add First Payment
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
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

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-500 w-16 h-16 rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.8}>
        <Icon name="plus" size={28} color="white" />
      </TouchableOpacity>

      {/* Enhanced Add Payment Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}>
            <View className="flex-1 justify-center px-4">
              <View
                style={{
                  backgroundColor: themeColors.surface,
                  borderRadius: 24,
                  maxHeight: '90%',
                  minHeight: '70%',
                }}>
                {/* Modal Header */}
                <View
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: themeColors.border,
                  }}>
                  <View className="flex-row items-center justify-between">
                    <ThemedText size="xl" weight="bold">
                      Add New Payment
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => {
                        resetForm();
                        setIsModalVisible(false);
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
                </View>

                <ScrollView
                  className="flex-1 px-4"
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{paddingBottom: 20}}>
                  <View className="py-4">
                    {/* Date of Payment */}
                    <View className="mb-4">
                      <ThemedText
                        size="sm"
                        weight="medium"
                        style={{marginBottom: 8}}>
                        Payment Date *
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: themeColors.surfaceVariant,
                          borderRadius: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 16,
                          borderWidth: 1,
                          borderColor: themeColors.border,
                        }}>
                        <Icon
                          name="calendar"
                          size={20}
                          color={themeColors.text.tertiary}
                        />
                        <ThemedText
                          style={{
                            flex: 1,
                            paddingHorizontal: 12,
                            fontSize: 16,
                            color: themeColors.text.primary,
                          }}>
                          {DOP.toLocaleDateString('en-GB')}
                        </ThemedText>
                        <Icon
                          name="chevron-down"
                          size={20}
                          color={themeColors.text.tertiary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Month of Payment */}
                    <View className="mb-4">
                      <ThemedText
                        size="sm"
                        weight="medium"
                        style={{marginBottom: 8}}>
                        Month of Payment *
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
                            focusedField === 'MOP'
                              ? RentAppColors.primary[500]
                              : formErrors.MOP
                              ? RentAppColors.status.error
                              : themeColors.border,
                        }}>
                        <Icon name="calendar-month" size={20} color="#9CA3AF" />
                        <TextInput
                          style={{
                            flex: 1,
                            paddingVertical: 16,
                            paddingHorizontal: 12,
                            fontSize: 16,
                            color: '#9CA3AF',
                          }}
                          placeholder="e.g., March 2024, Jan-Feb 2024"
                          placeholderTextColor="#9CA3AF"
                          value={MOP}
                          onChangeText={text => {
                            setMOP(text);
                            if (formErrors.MOP) {
                              setFormErrors(prev => ({...prev, MOP: ''}));
                            }
                          }}
                          onFocus={() => setFocusedField('MOP')}
                          onBlur={() => setFocusedField(null)}
                        />
                      </View>
                      {formErrors.MOP && (
                        <ThemedText
                          size="sm"
                          style={{
                            marginTop: 4,
                            marginLeft: 4,
                            color: RentAppColors.status.error,
                          }}>
                          {formErrors.MOP}
                        </ThemedText>
                      )}
                    </View>

                    {/* Room Rent */}
                    <View className="mb-4">
                      <ThemedText
                        size="sm"
                        weight="medium"
                        style={{marginBottom: 8}}>
                        Room Rent *
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
                            focusedField === 'RoomRent'
                              ? RentAppColors.primary[500]
                              : formErrors.RoomRent
                              ? RentAppColors.status.error
                              : themeColors.border,
                        }}>
                        <Icon name="currency-inr" size={20} color="#9CA3AF" />
                        <TextInput
                          style={{
                            flex: 1,
                            paddingVertical: 16,
                            paddingHorizontal: 12,
                            fontSize: 16,
                            color: '#9CA3AF',
                          }}
                          placeholder="Enter room rent amount"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                          value={RoomRent}
                          onChangeText={text => {
                            setRoomRent(text);
                            if (formErrors.RoomRent) {
                              setFormErrors(prev => ({
                                ...prev,
                                RoomRent: '',
                              }));
                            }
                          }}
                          onFocus={() => setFocusedField('RoomRent')}
                          onBlur={() => setFocusedField(null)}
                        />
                      </View>
                      {formErrors.RoomRent && (
                        <ThemedText
                          size="sm"
                          style={{
                            marginTop: 4,
                            marginLeft: 4,
                            color: RentAppColors.status.error,
                          }}>
                          {formErrors.RoomRent}
                        </ThemedText>
                      )}
                    </View>

                    {/* Meter Readings */}
                    <View className="mb-4">
                      <ThemedText
                        size="base"
                        weight="semibold"
                        style={{marginBottom: 16}}>
                        Electricity Meter Reading
                      </ThemedText>

                      {/* Previous Reading (Read-only) */}
                      <View className="mb-4">
                        <ThemedText
                          size="sm"
                          weight="medium"
                          style={{marginBottom: 8}}>
                          Previous Reading
                        </ThemedText>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: themeColors.surface,
                            borderRadius: 12,
                            paddingHorizontal: 16,
                            paddingVertical: 16,
                            borderWidth: 1,
                            borderColor: themeColors.border,
                          }}>
                          <Icon name="gauge-low" size={20} color="#6B7280" />
                          <ThemedText
                            variant="secondary"
                            style={{
                              flex: 1,
                              paddingHorizontal: 12,
                              fontSize: 16,
                            }}>
                            {previousReading} units
                          </ThemedText>
                        </View>
                      </View>

                      {/* Current Reading */}
                      <View className="mb-4">
                        <ThemedText
                          size="sm"
                          weight="medium"
                          style={{marginBottom: 8}}>
                          Current Reading *
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
                              focusedField === 'currentReading'
                                ? RentAppColors.primary[500]
                                : formErrors.currentReading
                                ? RentAppColors.status.error
                                : themeColors.border,
                          }}>
                          <Icon name="gauge" size={20} color="#9CA3AF" />
                          <TextInput
                            style={{
                              flex: 1,
                              paddingVertical: 16,
                              paddingHorizontal: 12,
                              fontSize: 16,
                              color: '#9CA3AF',
                            }}
                            placeholder="Enter current meter reading"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={currentReading}
                            onChangeText={text => {
                              setCurrentReading(text);
                              if (formErrors.currentReading) {
                                setFormErrors(prev => ({
                                  ...prev,
                                  currentReading: '',
                                }));
                              }
                            }}
                            onFocus={() => setFocusedField('currentReading')}
                            onBlur={() => setFocusedField(null)}
                          />
                        </View>
                        {formErrors.currentReading && (
                          <ThemedText
                            size="sm"
                            style={{
                              marginTop: 4,
                              marginLeft: 4,
                              color: RentAppColors.status.error,
                            }}>
                            {formErrors.currentReading}
                          </ThemedText>
                        )}
                      </View>

                      {/* Calculated Values */}
                      {currentReading &&
                        Number(currentReading) >= Number(previousReading) && (
                          <View
                            style={{
                              backgroundColor: isDark
                                ? RentAppColors.status.warning + '20'
                                : RentAppColors.status.warning + '10',
                              padding: 16,
                              borderRadius: 12,
                            }}>
                            <View className="flex-row items-center justify-between mb-2">
                              <ThemedText variant="secondary" weight="medium">
                                Units Consumed:
                              </ThemedText>
                              <ThemedText
                                weight="bold"
                                style={{color: RentAppColors.status.warning}}>
                                {Number(currentReading) -
                                  Number(previousReading)}{' '}
                                units
                              </ThemedText>
                            </View>
                            <View className="flex-row items-center justify-between">
                              <ThemedText variant="secondary" weight="medium">
                                Electricity Bill:
                              </ThemedText>
                              <ThemedText
                                weight="bold"
                                style={{color: RentAppColors.status.warning}}>
                                ₹
                                {(
                                  (Number(currentReading) -
                                    Number(previousReading)) *
                                  7
                                ).toLocaleString()}
                              </ThemedText>
                            </View>
                          </View>
                        )}
                    </View>

                    {/* Total Amount Preview */}
                    {RoomRent &&
                      currentReading &&
                      Number(currentReading) >= Number(previousReading) && (
                        <View
                          style={{
                            backgroundColor: isDark
                              ? RentAppColors.status.success + '20'
                              : RentAppColors.status.success + '10',
                            padding: 16,
                            borderRadius: 12,
                            marginBottom: 24,
                          }}>
                          <View className="flex-row items-center justify-between">
                            <ThemedText size="lg" weight="bold">
                              Total Amount:
                            </ThemedText>
                            <ThemedText
                              size="2xl"
                              weight="bold"
                              style={{color: RentAppColors.status.success}}>
                              ₹
                              {(
                                Number(RoomRent) +
                                (Number(currentReading) -
                                  Number(previousReading)) *
                                  7
                              ).toLocaleString()}
                            </ThemedText>
                          </View>
                        </View>
                      )}
                  </View>
                </ScrollView>

                {/* Modal Footer */}
                <View
                  style={{
                    padding: 16,
                    borderTopWidth: 1,
                    borderTopColor: themeColors.border,
                  }}>
                  <View className="flex-row" style={{gap: 16}}>
                    <TouchableOpacity
                      onPress={() => {
                        resetForm();
                        setIsModalVisible(false);
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
                      onPress={handleAddPayment}
                      disabled={addLoading}
                      style={{
                        flex: 1,
                        paddingVertical: 16,
                        borderRadius: 12,
                        alignItems: 'center',
                        backgroundColor: addLoading
                          ? themeColors.surfaceVariant
                          : RentAppColors.primary[500],
                      }}>
                      {addLoading ? (
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
                            Add Payment
                          </ThemedText>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Date Picker */}
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
      </Modal>
    </View>
  );
};

export default TransactionList;
