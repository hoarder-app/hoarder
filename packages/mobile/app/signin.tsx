import { View, Text } from "react-native";

import Logo from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function Signin() {
  return (
    <View className="container justify-center h-full flex flex-col gap-2">
      <View className="items-center">
        <Logo />
      </View>
      <View className="gap-2">
        <Text className="font-bold">Email</Text>
        <Input className="w-full" placeholder="Email" />
      </View>
      <View className="gap-2">
        <Text className="font-bold">Password</Text>
        <Input className="w-full" placeholder="Password" secureTextEntry />
      </View>
      <Button className="w-full" label="Sign In" />
    </View>
  );
}
