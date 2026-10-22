import React from 'react';
import {StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {BellRing, Home, Search, Ticket, UserRound} from '../assets/icons/icons';
import {AppDrawerProvider} from '../components/AppDrawer';
import {HomeScreen} from '../screens/HomeScreen';
import {ExploreScreen, MyQueueScreen, NotificationsScreen, ProfileScreen} from '../screens/CustomerScreens';
import {COLORS} from '../theme/theme';
import {CustomerTabParamList, RootStackParamList} from './types';

const Tab = createBottomTabNavigator<CustomerTabParamList>();
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function CustomerNavigator({navigation}: Props) {
  const navigateFromDrawer = (route: string) => {
    if (route === 'Login') navigation.reset({index: 0, routes: [{name: 'Login'}]});
    else if (route === 'Explore') navigation.navigate('Home');
    else navigation.navigate(route as keyof RootStackParamList, undefined as never);
  };
  return <AppDrawerProvider onNavigate={navigateFromDrawer}>
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Tab.Navigator screenOptions={({route}) => ({
      headerShown: false, tabBarActiveTintColor: COLORS.primary, tabBarInactiveTintColor: '#8290A5',
      tabBarLabelStyle: {fontSize: 10, fontWeight: '700', paddingBottom: 4}, tabBarStyle: {borderTopColor: '#E5EBF1', height: 68, paddingTop: 7},
      tabBarIcon: ({color, size}) => {const icons = {HomeTab: Home, Explore: Search, MyQueue: Ticket, Notifications: BellRing, Profile: UserRound}; const Icon = icons[route.name]; return <Icon color={color} size={size} />;},
    })}>
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{title: 'Home'}} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="MyQueue" component={MyQueueScreen} options={{title: 'My Queue'}} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  </AppDrawerProvider>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
