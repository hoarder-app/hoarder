import { Text, View } from "react-native";
import { PackageOpen } from "lucide-react-native";

export default function Logo() {
  return (
    <View className="flex flex-row items-center justify-center gap-2 ">
      <PackageOpen color="black" size={70} />
      <Text className="text-5xl">Hoarder</Text>
    </View>
  );
}
