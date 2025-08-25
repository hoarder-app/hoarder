import { Pressable, View } from "react-native";
import CustomSafeAreaView from "@/components/ui/CustomSafeAreaView";
import { Divider } from "@/components/ui/Divider";
import { Text } from "@/components/ui/Text";
import { useColorScheme } from "@/lib/useColorScheme";
import { Check } from "lucide-react-native";

export default function ThemePage() {
  const { colorScheme, setColorScheme } = useColorScheme();

  const options = (["light", "dark"] as const)
    .map((theme) => {
      const isChecked = colorScheme === theme;
      return [
        <Pressable
          onPress={() => setColorScheme(theme)}
          className="flex flex-row justify-between"
          key={theme}
        >
          <Text>
            {
              { light: "Light Mode", dark: "Dark Mode", system: "System" }[
                theme
              ]
            }
          </Text>
          {isChecked && <Check color="rgb(0, 122, 255)" />}
        </Pressable>,
        <Divider
          key={theme + "-divider"}
          orientation="horizontal"
          className="my-3 h-0.5 w-full"
        />,
      ];
    })
    .flat();
  options.pop();

  return (
    <CustomSafeAreaView>
      <View className="flex h-full w-full items-center px-4 py-2">
        <View className="w-full rounded-lg bg-card px-4 py-2">{options}</View>
      </View>
    </CustomSafeAreaView>
  );
}
