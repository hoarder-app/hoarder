import { PackageOpen } from "lucide-react";

export default function Logo() {
  return (
    <span className="mx-auto flex gap-2">
      <PackageOpen size="40" className="my-auto" />
      <p className="text-4xl">Hoarder</p>
    </span>
  );
}
