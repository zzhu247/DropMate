export const ROUTES = {
  Splash: 'Splash',
  Tutorial: 'Tutorial',
  Login: 'Login',
  Signup: 'Signup',
  ForgotPassword: 'ForgotPassword',
  Main: 'Main',
  Profile: 'Profile',
  ShipmentDetails: 'ShipmentDetails',
  AddTracking: 'AddTracking',
} as const;

export const TABS = {
  Home: 'HomeTab',
  Track: 'TrackTab',
  Map: 'MapTab',
  Settings: 'SettingsTab',
} as const;

export const DEEP_LINK_PATTERN = 'dropmate://track/:id';
