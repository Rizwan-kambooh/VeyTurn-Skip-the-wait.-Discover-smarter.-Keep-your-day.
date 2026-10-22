export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  ForgotPassword: undefined;
  VerifyCode: {email: string};
  ResetPassword: {resetToken: string};
  BusinessDetails: {businessId: string};
  QueueJoined: {businessId?: string} | undefined;
  LiveQueue: {businessId?: string; entryId?: string} | undefined;
  EditProfile: undefined;
  History: undefined;
  SavedBusinesses: undefined;
  Preferences: undefined;
  RegisterBusiness: undefined;
  BusinessSetup: undefined;
  BusinessApp: undefined;
};

export type CustomerTabParamList = {
  HomeTab: undefined;
  Explore: {category?: string} | undefined;
  MyQueue: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type BusinessTabParamList = {
  BusinessHome: undefined;
  ManageQueue: undefined;
  Customers: undefined;
  Analytics: undefined;
  BusinessProfile: undefined;
};
