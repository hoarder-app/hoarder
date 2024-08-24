import { Image } from "react-native";
import useAppSettings from "@/lib/settings";

export default function BookmarkAssetImage({
  assetId,
  className,
}: {
  assetId: string;
  className: string;
}) {
  const { settings } = useAppSettings();
  return (
    <Image
      source={{
        uri: `${settings.address}/api/assets/${assetId}`,
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
        },
      }}
      className={className}
    />
  );
}
