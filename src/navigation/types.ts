import { NavigatorScreenParams } from '@react-navigation/native';

export type BottomTabParamList = {
  HomeTab: undefined;
  TrackTab: undefined;
  MapTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Tutorial: undefined;
  Login: undefined;
  Main: NavigatorScreenParams<BottomTabParamList> | undefined;
  Profile: undefined;
  ShipmentDetails: { shipmentId: string };
  AddTracking: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
