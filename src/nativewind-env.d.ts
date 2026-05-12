// NativeWind v4 type declarations for className on all components
// This augments the react-native-safe-area-context types
// The actual className-to-style transform is handled at Babel/metro build time

import "react-native-safe-area-context";

declare module "react-native-safe-area-context" {
  interface NativeSafeAreaViewProps {
    className?: string;
  }
  interface SafeAreaViewProps extends NativeSafeAreaViewProps {
    className?: string;
  }
}
