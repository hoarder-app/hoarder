import Image from "next/image";
import hoarderLogoIcon from "@/public/icons/logo-icon.svg";
import hoarderLogoText from "@/public/icons/logo-text.svg";

export default function HoarderLogo({
  height,
  gap,
}: {
  height: number;
  gap: string;
}) {
  return (
    <span style={{ gap }} className="flex items-center">
      <Image
        alt="Hoarder Logo"
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        src={hoarderLogoIcon}
        height={height}
        className={`fill-foreground`}
      />
      <Image
        alt="Hoarder Logo Text"
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        src={hoarderLogoText}
        height={(height * 2) / 3}
        className={`fill-foreground`}
      />
    </span>
  );
}
