import KarakeepFull from "@/public/icons/karakeep-full.svg";

export default function HoarderLogo({ height }: { height: number }) {
  return (
    <span className="flex items-center">
      <KarakeepFull height={height} className={`fill-foreground`} />
    </span>
  );
}
