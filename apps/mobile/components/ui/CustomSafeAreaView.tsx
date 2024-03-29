import { Platform, SafeAreaView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";

export default function CustomSafeAreaView({
  children,
}: {
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  return (
    <SafeAreaView
      style={{
        paddingTop:
          // Some ugly hacks to make the app look the same on both android and ios
          Platform.OS == "android"
            ? headerHeight > 0
              ? headerHeight
              : insets.top
            : undefined,
      }}
    >
      {children}
    </SafeAreaView>
  );
}
