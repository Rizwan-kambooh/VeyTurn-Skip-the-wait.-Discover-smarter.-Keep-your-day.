import React from 'react';
import {StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {BarChart3, Home, ListFilter, MoreHorizontal, UsersRound} from '../assets/icons/icons';
import {AnalyticsScreen, BusinessDashboardScreen, BusinessProfileScreen, CustomersScreen, ManageQueueScreen} from '../screens/BusinessScreens';
import {COLORS} from '../theme/theme';
import {BusinessTabParamList} from './types';
import {SafeAreaView} from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator<BusinessTabParamList>();
export function BusinessNavigator() {return <SafeAreaView edges={['top']} style={styles.safeArea}><Tab.Navigator screenOptions={({route}) => ({headerShown: false, tabBarActiveTintColor: COLORS.primary, tabBarInactiveTintColor: '#8290A5', tabBarLabelStyle: {fontSize: 10, fontWeight: '700', paddingBottom: 4}, tabBarStyle: {borderTopColor: '#E5EBF1', height: 68, paddingTop: 7}, tabBarIcon: ({color, size}) => {const icons = {BusinessHome: Home, ManageQueue: ListFilter, Customers: UsersRound, Analytics: BarChart3, BusinessProfile: MoreHorizontal}; const Icon = icons[route.name]; return <Icon color={color} size={size} />;}})}>
  <Tab.Screen name="BusinessHome" component={BusinessDashboardScreen} options={{title: 'Home'}} /><Tab.Screen name="ManageQueue" component={ManageQueueScreen} options={{title: 'Queue'}} /><Tab.Screen name="Customers" component={CustomersScreen} /><Tab.Screen name="Analytics" component={AnalyticsScreen} /><Tab.Screen name="BusinessProfile" component={BusinessProfileScreen} options={{title: 'More'}} />
</Tab.Navigator></SafeAreaView>;}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
