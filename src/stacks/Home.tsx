// ================== Type Definitions ==================
import React, {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import PropertyListScreen from '../screens/PropertyListScreen';
import {NavigationContainer} from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch} from '../redux/store';
import {retriveAuth} from '../redux/authSlice';
import {RootState} from '../redux/store';
import {ActivityIndicator, useColorScheme} from 'react-native';
import {RentAppColors, getRentThemeColors} from '../constants/colors';

import TenantCarousel from '../screens/TenantCarousel';
import TransactionList from '../screens/TransactionList';
import TenantDocuments from '../screens/TenantDocuments';
import {MenuProvider} from 'react-native-popup-menu';
import PropertyDetailScreen from '../screens/PropertyDetailScreen ';

// Params for Home Stack
export type RootStackParamList = {
  Login: undefined; // No parameters expected
  Properties: undefined; // No parameters expected
  PropertyDetail: {propertyId: string};
  RoomDetail: {roomId: string};
  TransactionDetails: {
    tenantId: string;
    roomId: string;
    previousReading: number;
  };
  TenantDocuments: {
    tenantId: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeStackNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = getRentThemeColors(isDark);

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const loading = useSelector((state: RootState) => state.auth.status);
  console.log(currentUser);
  useEffect(() => {
    dispatch(retriveAuth());
  }, [dispatch]);
  if (loading === 'loading') {
    return (
      <ActivityIndicator
        size="large"
        color={RentAppColors.primary[500]}
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          flex: 1,
          justifyContent: 'center',
          backgroundColor: themeColors.background,
        }}
      />
    );
  }
  return (
    <NavigationContainer>
      <MenuProvider>
        <Stack.Navigator
          initialRouteName={currentUser ? 'Properties' : 'Login'}
          screenOptions={{
            headerStyle: {
              backgroundColor: themeColors.surface,
            },
            headerTitleStyle: {
              fontFamily: 'System',
              fontWeight: '700',
              fontSize: 18,
              color: themeColors.text.primary,
            },
            headerTitleAlign: 'center',
            headerTintColor: RentAppColors.primary[600],
          }}>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Properties"
            component={PropertyListScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="PropertyDetail"
            component={PropertyDetailScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="RoomDetail"
            component={TenantCarousel}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="TransactionDetails"
            component={TransactionList}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="TenantDocuments"
            component={TenantDocuments}
            options={{headerShown: false}}
          />
        </Stack.Navigator>
      </MenuProvider>
    </NavigationContainer>
  );
}

export default HomeStackNavigator;
