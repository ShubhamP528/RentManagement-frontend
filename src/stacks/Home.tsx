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
import {ActivityIndicator} from 'react-native';

import TenantCarousel from '../screens/TenantCarousel';
import TransactionList from '../screens/TransactionList';
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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeStackNavigator() {
  const dispatch = useDispatch<AppDispatch>();

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
        color="#0000ff"
        // eslint-disable-next-line react-native/no-inline-styles
        style={{flex: 1, justifyContent: 'center'}}
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
              backgroundColor: '#b2cfe9',
            },
            headerTitleStyle: {
              fontFamily: 'System',
              fontWeight: '700',
              fontSize: 18,
              color: '#333',
            },
            headerTitleAlign: 'center',
            headerTintColor: '#333',
          }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="Properties"
            component={PropertyListScreen}
            options={{title: 'My Properties', headerShown: true}}
          />
          <Stack.Screen
            name="PropertyDetail"
            component={PropertyDetailScreen}
          />
          <Stack.Screen name="RoomDetail" component={TenantCarousel} />
          <Stack.Screen name="TransactionDetails" component={TransactionList} />
        </Stack.Navigator>
      </MenuProvider>
    </NavigationContainer>
  );
}

export default HomeStackNavigator;
