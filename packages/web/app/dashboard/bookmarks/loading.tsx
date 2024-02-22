import Spinner from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex size-full">
      <div className="m-auto">
        <Spinner />
      </div>
    </div>
  );
}
