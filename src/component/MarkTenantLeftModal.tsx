import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RentAppColors, getRentThemeColors} from '../constants/colors';
import {useTheme} from '../contexts/ThemeContext';
import {ThemedText} from './ThemedText';
import api from '../axiosConfig';

import { Tenant } from '../screens/TenantCarousel';

interface CalculationResult {
  startDate: string;
  billingCycleDay?: number | null;
  endDate: string;
  rentRate: number;
  totalMonths: number;
  totalDays: number;
  totalRentAccrued: number;
  totalRentPaid: number;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  electricityBill: number;
  totalElectricityPaid: number;
  totalPaidAmount: number;
  outstandingRent: number;
  totalOutstanding: number;
}

interface MarkTenantLeftModalProps {
  visible: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  roomId: string;
  onSuccess: (updatedTenant: Tenant) => void;
}

const MarkTenantLeftModal = ({
  visible,
  onClose,
  tenant,
  roomId,
  onSuccess,
}: MarkTenantLeftModalProps) => {
  const {isDark} = useTheme();
  const themeColors = getRentThemeColors(isDark);

  const [leftDate, setLeftDate] = useState<Date>(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [currentReading, setCurrentReading] = useState('');
  const [amountPaidNow, setAmountPaidNow] = useState('');
  const [isAmountManuallyEdited, setIsAmountManuallyEdited] = useState(false);

  const [isLoadingCalcs, setIsLoadingCalcs] = useState(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [readingError, setReadingError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const prevReading = tenant
    ? tenant.finalReading !== undefined
      ? tenant.finalReading
      : tenant.initialReading
    : 0;

  // Initialize and reset fields when tenant changes or modal is shown
  useEffect(() => {
    if (visible && tenant) {
      setLeftDate(new Date());
      setCurrentReading(prevReading.toString());
      setAmountPaidNow('0');
      setIsAmountManuallyEdited(false);
      setCalculationResult(null);
      setReadingError('');
    }
  }, [visible, tenant, prevReading]);

  // Debounced API call to fetch calculations when date or reading changes
  useEffect(() => {
    if (!visible || !tenant) return;

    const currNum = Number(currentReading);
    if (isNaN(currNum)) {
      setReadingError('Please enter a valid reading number');
      setCalculationResult(null);
      return;
    }
    if (currNum < prevReading) {
      setReadingError(`Reading must be greater than or equal to previous reading (${prevReading})`);
      setCalculationResult(null);
      return;
    }

    setReadingError('');

    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsLoadingCalcs(true);
        const response = await api.get(
          `/tenant/calculateLeftDetails/${tenant._id}`,
          {
            params: {
              endDate: leftDate.toISOString(),
              currentReading: currNum,
            },
          },
        );
        const data = response.data;
        setCalculationResult(data);

        // Pre-fill amount paid now with total outstanding if not manually edited by the user
        if (!isAmountManuallyEdited) {
          const outstanding = data.totalOutstanding;
          setAmountPaidNow(outstanding > 0 ? outstanding.toString() : '0');
        }
      } catch (err: any) {
        console.error('Failed to fetch checkout calculations:', err);
        setCalculationResult(null);
      } finally {
        setIsLoadingCalcs(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [leftDate, currentReading, visible, tenant, prevReading, isAmountManuallyEdited]);

  const handleConfirmCheckout = async () => {
    if (!tenant) return;

    const currNum = Number(currentReading);
    if (isNaN(currNum) || currNum < prevReading) {
      Alert.alert('Error', 'Please enter a valid final meter reading.');
      return;
    }

    try {
      setIsSaving(true);
      const response = await api.post(`/tenant/removeTenant/${roomId}`, {
        tenantId: tenant._id,
        endDate: leftDate.toISOString(),
        currentReading: currNum,
        amountPaidNow: Number(amountPaidNow) || 0,
      });

      Alert.alert('Success', 'Tenant checked out successfully! 🎉');
      onSuccess(response.data.tenant);
      onClose();
    } catch (error: any) {
      console.error('Failed to checkout tenant:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to complete checkout.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleDateConfirm = (date: Date) => {
    setLeftDate(date);
    hideDatePicker();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}>
          <View className="flex-1 justify-end">
            <View
              style={{
                backgroundColor: themeColors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: '90%',
                minHeight: '60%',
              }}>
              
              {/* Header */}
              <View
                style={{
                  padding: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: themeColors.border,
                }}>
                <View className="flex-row items-center justify-between">
                  <View>
                    <ThemedText size="xl" weight="bold">
                      Mark Tenant as Left
                    </ThemedText>
                    <ThemedText variant="secondary" size="sm" style={{marginTop: 2}}>
                      Checkout processing for {tenant?.headPerson?.name}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    style={{
                      width: 36,
                      height: 36,
                      backgroundColor: themeColors.surfaceVariant,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Icon name="close" size={20} color={themeColors.text.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                
                <View className="py-4">
                  {/* Tenure info */}
                  <View
                    className="mb-5 p-4 rounded-xl flex-row items-center"
                    style={{
                      backgroundColor: themeColors.surfaceVariant,
                    }}>
                    <Icon name="clock-outline" size={22} color={themeColors.primary} />
                    <View className="ml-3 flex-1">
                      <ThemedText size="sm" weight="medium" variant="secondary">
                        Start Date
                      </ThemedText>
                      <ThemedText size="base" weight="semibold">
                        {tenant ? new Date(tenant.startDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }) : ''}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Left Date Selector */}
                  <View className="mb-4">
                    <ThemedText size="sm" weight="semibold" style={{marginBottom: 8}}>
                      Departure Date *
                    </ThemedText>
                    <TouchableOpacity
                      onPress={showDatePicker}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: themeColors.surfaceVariant,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderWidth: 1,
                        borderColor: themeColors.border,
                      }}>
                      <Icon name="calendar" size={20} color={themeColors.text.tertiary} />
                      <ThemedText
                        style={{
                          flex: 1,
                          paddingHorizontal: 12,
                          fontSize: 16,
                          color: themeColors.text.primary,
                        }}>
                        {leftDate.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </ThemedText>
                      <Icon name="chevron-down" size={20} color={themeColors.text.tertiary} />
                    </TouchableOpacity>
                  </View>

                  {/* Final Electricity Reading Input */}
                  <View className="mb-4">
                    <ThemedText size="sm" weight="semibold" style={{marginBottom: 8}}>
                      Final Electricity Reading *
                    </ThemedText>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: themeColors.surfaceVariant,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        borderWidth: 2,
                        borderColor:
                          focusedField === 'reading'
                            ? themeColors.primary
                            : readingError
                            ? themeColors.status.error
                            : themeColors.border,
                      }}>
                      <Icon name="gauge" size={20} color={themeColors.text.tertiary} />
                      <TextInput
                        style={{
                          flex: 1,
                          paddingVertical: 14,
                          paddingHorizontal: 12,
                          fontSize: 16,
                          color: themeColors.text.primary,
                        }}
                        placeholder="Enter final meter reading"
                        placeholderTextColor={themeColors.text.tertiary}
                        keyboardType="numeric"
                        value={currentReading}
                        onChangeText={text => {
                          setCurrentReading(text);
                        }}
                        onFocus={() => setFocusedField('reading')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                    <ThemedText variant="secondary" size="xs" style={{marginTop: 6, marginLeft: 4}}>
                      Previous Reading: {prevReading} units
                    </ThemedText>
                    {readingError ? (
                      <Text
                        style={{
                          color: themeColors.status.error,
                          fontSize: 13,
                          marginTop: 4,
                          marginLeft: 4,
                        }}>
                        {readingError}
                      </Text>
                    ) : null}
                  </View>

                  {/* Calculations Overview */}
                  <View
                    className="mb-5 p-4 rounded-2xl border"
                    style={{
                      borderColor: themeColors.border,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                    }}>
                    <ThemedText size="base" weight="bold" style={{marginBottom: 12}}>
                      Calculations Summary
                    </ThemedText>

                    {isLoadingCalcs ? (
                      <View className="py-6 items-center justify-center">
                        <ActivityIndicator size="small" color={themeColors.primary} />
                        <ThemedText variant="secondary" size="sm" style={{marginTop: 8}}>
                          Calculating outstanding balance...
                        </ThemedText>
                      </View>
                    ) : calculationResult ? (
                      <View style={{gap: 8}}>
                        {/* Tenure */}
                        <View className="flex-row justify-between py-1">
                          <ThemedText variant="secondary" size="sm">Tenure Stayed</ThemedText>
                          <ThemedText size="sm" weight="semibold">
                            {calculationResult.totalMonths}m {calculationResult.totalDays}d
                          </ThemedText>
                        </View>

                        {/* Rent Rate */}
                        <View className="flex-row justify-between py-1">
                          <ThemedText variant="secondary" size="sm">Rent Rate</ThemedText>
                          <ThemedText size="sm" weight="semibold">
                            ₹{calculationResult.rentRate}/month ({calculationResult.billingCycleDay ? `${calculationResult.billingCycleDay}th of month` : `${new Date(calculationResult.startDate).getDate()}th of month`})
                          </ThemedText>
                        </View>

                        {/* Total Rent Accrued */}
                        <View className="flex-row justify-between py-1">
                          <ThemedText variant="secondary" size="sm">Total Rent Accrued</ThemedText>
                          <ThemedText size="sm" weight="semibold">
                            ₹{calculationResult.totalRentAccrued}
                          </ThemedText>
                        </View>

                        {/* Rent Paid */}
                        <View className="flex-row justify-between py-1">
                          <ThemedText variant="secondary" size="sm">Rent Paid So Far</ThemedText>
                          <ThemedText size="sm" weight="semibold" style={{color: themeColors.status.success}}>
                            ₹{calculationResult.totalRentPaid}
                          </ThemedText>
                        </View>

                        <View style={{height: 1, backgroundColor: themeColors.border, marginVertical: 4}} />

                        {/* Electricity Units */}
                        <View className="flex-row justify-between py-1">
                          <ThemedText variant="secondary" size="sm">Electricity Units</ThemedText>
                          <ThemedText size="sm" weight="semibold">
                            {calculationResult.unitsConsumed} units
                          </ThemedText>
                        </View>

                        {/* Electricity Bill */}
                        <View className="flex-row justify-between py-1">
                          <ThemedText variant="secondary" size="sm">Electricity Bill (₹7/u)</ThemedText>
                          <ThemedText size="sm" weight="semibold">
                            ₹{calculationResult.electricityBill}
                          </ThemedText>
                        </View>

                        <View style={{height: 1, backgroundColor: themeColors.border, marginVertical: 4}} />

                        {/* Total Outstanding */}
                        <View className="flex-row justify-between py-1 items-center">
                          <ThemedText weight="bold" size="base">Total Outstanding</ThemedText>
                          <ThemedText
                            weight="bold"
                            size="lg"
                            style={{
                              color:
                                calculationResult.totalOutstanding > 0
                                  ? themeColors.status.error
                                  : themeColors.status.success,
                            }}>
                            ₹{calculationResult.totalOutstanding}
                          </ThemedText>
                        </View>
                      </View>
                    ) : (
                      <View className="py-4 items-center">
                        <ThemedText variant="secondary" size="sm">
                          Enter a valid final meter reading to see summary.
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  {/* Amount Paid Now Input */}
                  <View className="mb-6">
                    <ThemedText size="sm" weight="semibold" style={{marginBottom: 8}}>
                      Amount Paid Now (₹) *
                    </ThemedText>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: themeColors.surfaceVariant,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        borderWidth: 2,
                        borderColor:
                          focusedField === 'amountPaid' ? themeColors.primary : themeColors.border,
                      }}>
                      <Icon name="currency-inr" size={20} color={themeColors.text.tertiary} />
                      <TextInput
                        style={{
                          flex: 1,
                          paddingVertical: 14,
                          paddingHorizontal: 12,
                          fontSize: 16,
                          color: themeColors.text.primary,
                        }}
                        placeholder="Enter amount paid at departure"
                        placeholderTextColor={themeColors.text.tertiary}
                        keyboardType="numeric"
                        value={amountPaidNow}
                        onChangeText={text => {
                          setAmountPaidNow(text);
                          setIsAmountManuallyEdited(true);
                        }}
                        onFocus={() => setFocusedField('amountPaid')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                    {calculationResult && Number(amountPaidNow) < calculationResult.totalOutstanding ? (
                      <ThemedText
                        size="xs"
                        style={{
                          marginTop: 6,
                          marginLeft: 4,
                          color: themeColors.status.warning,
                        }}>
                        ⚠️ Remaining ₹{calculationResult.totalOutstanding - (Number(amountPaidNow) || 0)} will be marked as Pending.
                      </ThemedText>
                    ) : null}
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row items-center mb-6" style={{gap: 12}}>
                    <TouchableOpacity
                      onPress={onClose}
                      style={{
                        flex: 1,
                        paddingVertical: 16,
                        borderRadius: 12,
                        backgroundColor: themeColors.surfaceVariant,
                        alignItems: 'center',
                      }}>
                      <ThemedText weight="semibold">Cancel</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleConfirmCheckout}
                      disabled={isSaving || !!readingError || isLoadingCalcs}
                      style={{
                        flex: 2,
                        paddingVertical: 16,
                        borderRadius: 12,
                        backgroundColor: themeColors.status.error,
                        alignItems: 'center',
                        opacity: isSaving || !!readingError || isLoadingCalcs ? 0.6 : 1,
                      }}>
                      {isSaving ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text
                          style={{
                            color: 'white',
                            fontWeight: '600',
                            fontSize: 16,
                          }}>
                          Confirm & Mark Left
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={leftDate}
        onConfirm={handleDateConfirm}
        onCancel={hideDatePicker}
      />
    </Modal>
  );
};

export default MarkTenantLeftModal;
