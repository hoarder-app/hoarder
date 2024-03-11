import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

import { useSession } from "@/lib/session";

export default function App() {
  const router = useRouter();
  const { isLoggedIn } = useSession();
  useEffect(() => {
    if (isLoggedIn === undefined) {
      // Wait until it's loaded
    } else if (isLoggedIn) {
      router.replace("dashboard");
    } else {
      router.replace("signin");
    }
  }, [isLoggedIn]);
  return <View />;
}
