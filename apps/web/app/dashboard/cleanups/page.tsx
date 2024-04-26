import { TagDuplicationDetection } from "@/components/dashboard/cleanups/TagDuplicationDetention";
import { Separator } from "@/components/ui/separator";
import { Paintbrush, Tags } from "lucide-react";

export default function Cleanups() {
  return (
    <div className="flex flex-col gap-y-4 rounded-md border bg-background p-4">
      <span className="flex items-center gap-1 text-2xl">
        <Paintbrush />
        Cleanups
      </span>
      <Separator />
      <span className="flex items-center gap-1 text-xl">
        <Tags />
        Duplicate Tags
      </span>
      <Separator />
      <TagDuplicationDetection />
    </div>
  );
}
