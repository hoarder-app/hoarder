import { Text } from "react-native";

export default function PageTitle({ title }: { title: string }) {
  return (
    <Text className="p-4 text-4xl font-bold text-foreground">{title}</Text>
  );
}
