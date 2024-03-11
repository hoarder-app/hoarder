import Logo from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextInput, View } from "react-native";

export default function Signin() {
  return (
    <View className="items-center justify-center h-full">
      <Logo />

      <Input  />
      <Button label="Sign In"  />

    </View>
  );
}
