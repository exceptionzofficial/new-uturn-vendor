import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';

// Screens
import SplashScreen from './src/screens/auth/SplashScreen';
import LanguageScreen from './src/screens/auth/LanguageScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import OtpScreen from './src/screens/auth/OtpScreen';
import MainScreen from './src/screens/main/MainScreen';
import AddTripScreen from './src/screens/trips/AddTripScreen';
import WalletScreen from './src/screens/features/WalletScreen';
import ProfileScreen from './src/screens/features/ProfileScreen';
import DriverApprovalScreen from './src/screens/trips/DriverApprovalScreen';
import TripTrackingScreen from './src/screens/trips/TripTrackingScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyle: { backgroundColor: '#F5F7FA' },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Language" component={LanguageScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="AddTrip" component={AddTripScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="DriverApproval" component={DriverApprovalScreen} />
        <Stack.Screen name="TripTracking" component={TripTrackingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
