import HoarderLogoIcon from "@/public/icons/logo-icon.svg";
import HoarderLogoText from "@/public/icons/logo-text.svg";

export default function HoarderLogo({
  height,
  gap,
  isCollapsed,
}: {
  height: number;
  gap: string;
  isCollapsed: boolean;
}) {
  return (
    <span style={{ gap }} className="flex items-center">
      <HoarderLogoIcon height={height} className="fill-foreground" />
      {!isCollapsed && (
        <HoarderLogoText
          height={(height * 2) / 3}
          className="fill-foreground"
        />
      )}
    </span>
  );
}
