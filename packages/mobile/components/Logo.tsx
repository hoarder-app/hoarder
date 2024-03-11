import { PackageOpen } from "lucide-react-native";
import { View, Text } from "react-native";

export default function Logo() {
  return (
    <View className="flex flex-row gap-2 justify-center items-center ">
      <PackageOpen color="black" size={70} />
      <Text className="text-5xl">Hoarder</Text>
    </View>
  );
}
